/* DeskBuddy v2 simulator — phone app + device, one shared state.
   Messages mirror docs/PROTOCOL.md of the real firmware; the link is simulated. */
(function () {
  'use strict';
  var root = document.getElementById('sim');
  if (!root || !window.Mochi) return;

  var M = window.Mochi;
  var $ = function (id) { return document.getElementById(id); };
  var phBody = $('phBody'), phone = $('phone'), oled = $('simOled'), oledWrap = $('simOledWrap');
  var logEl = $('simLog'), line = $('linkLine');

  var SCREENS = ['clock', 'weather', 'mochi', 'notify', 'pomo'];
  var SCREEN_LBL = { clock: 'CLOCK', weather: 'WTHR', mochi: 'MOCHI', notify: 'INBOX', pomo: 'POMO' };
  var APPS = ['WhatsApp', 'Gmail', 'Instagram', 'Calendar'];
  var SAMPLES = [
    { app: 'WhatsApp', title: 'Mom', msg: 'Dinner is ready' },
    { app: 'Gmail', title: 'Placement Cell', msg: 'Pre-placement talk moved to 3 PM, Seminar Hall 2' },
    { app: 'Instagram', title: 'diecast.daily', msg: 'liked your photo' },
    { app: 'Calendar', title: 'Lab viva', msg: 'Embedded systems lab viva in 30 minutes' },
    { app: 'WhatsApp', title: 'Bench crew', msg: 'Who has the spare INMP441?' }
  ];
  var BLINKABLE = { default: 1, angry: 1, sad: 1, smug: 1, nervous: 1, cute: 1, cat: 1, sleepy: 1 };

  function initial() {
    return {
      tab: 'home', screen: 'mochi', mood: 'happy', react: null, mode: null, popup: null,
      notes: [], log: [], noteIdx: 0, silent: false, volume: 60, brightness: 100,
      ptheme: 'auto', city: 'Bengaluru', cityDraft: 'Bengaluru', sayDraft: '',
      forward: { WhatsApp: true, Gmail: true, Instagram: false, Calendar: true },
      pomoLeft: 1500, pomoRun: false, linked: true, sample: 0, idle: 0, blink: false, speakFrame: 0, sayText: ''
    };
  }
  var S = initial();
  var timers = {};
  function later(key, ms, fn) { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms); }

  /* ---------------- audio (Web Audio square waves) ---------------- */
  var ac = null, soundOn = true;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(f1, f2, dur, delay, type) {
    if (!soundOn || S.silent || !ac) return;
    var t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    var v = 0.16 * (S.volume / 100);
    o.type = type || 'square';
    o.frequency.setValueAtTime(f1, t);
    if (f2) o.frequency.linearRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  var SFX = {
    click: function () { tone(1400, 0, 0.03); },
    screen: function () { tone(900, 1300, 0.06); },
    notify: function () { tone(880, 0, 0.09); tone(1320, 0, 0.14, 0.1); },
    pong: function () { tone(1000, 0, 0.05); tone(1000, 0, 0.05, 0.09); },
    purr: function () { for (var i = 0; i < 6; i++) tone(110 + (i % 2) * 20, 0, 0.07, i * 0.07, 'triangle'); },
    mood: function () { tone(700, 1000, 0.08); },
    wink: function () { tone(1600, 2000, 0.05); },
    listen: function () { tone(600, 900, 0.1); },
    listenEnd: function () { tone(900, 600, 0.1); },
    timer: function () { for (var i = 0; i < 3; i++) tone(1200, 0, 0.12, i * 0.2); },
    blip: function () { tone(300 + Math.random() * 500, 0, 0.04, 0, 'triangle'); }
  };

  /* ---------------- link: packets + protocol log ---------------- */
  function send(dir, msg) {
    var txt = JSON.stringify(msg);
    logEl.textContent = (dir === 'a2d' ? 'APP → DEV  ' : 'DEV → APP  ') + txt;
    if (line && line.childElementCount < 6) {
      var p = document.createElement('i');
      p.className = 'pkt ' + dir;
      p.addEventListener('animationend', function () { p.remove(); });
      line.appendChild(p);
    }
  }
  function state(extra) {
    var m = { type: 'state', screen: S.screen === 'pomo' ? 'pomodoro' : S.screen, mood: S.mood, unread: S.notes.length, silent: S.silent };
    for (var k in extra) m[k] = extra[k];
    later('state', 380, function () { send('d2a', m); });
  }

  /* ---------------- device rendering ---------------- */
  function shownFace() {
    if (S.react) return S.react;
    if (S.idle >= 1 && S.screen === 'mochi') return 'sleepy';
    return S.mood;
  }
  function oledMarkup() {
    var o = {
      silent: S.silent, unread: S.notes.length, city: S.city, demo: true, temp: 28,
      pomoLeft: S.pomoLeft, pomoRun: S.pomoRun, sayText: S.sayText, speakFrame: S.speakFrame
    };
    if (S.mode === 'sleep') return M.face('sleeping');
    if (S.mode === 'find') return M.screen('find');
    if (S.mode === 'listen') return M.screen('listen', { levels: S.levels });
    if (S.mode === 'think') return M.screen('think');
    if (S.mode === 'say') return M.screen('say', o);
    if (S.popup) { o.note = S.popup; return M.screen('notify', o); }
    if (S.screen === 'mochi') {
      var f = shownFace();
      if (S.blink && BLINKABLE[f]) f = 'blink';
      return M.face(f);
    }
    if (S.screen === 'notify') {
      o.note = S.notes[S.noteIdx] || null; o.idx = S.noteIdx + 1; o.count = S.notes.length;
    }
    return M.screen(S.screen, o);
  }
  var lastOled = '';
  function renderDevice() {
    var html = oledMarkup();
    if (html !== lastOled) {
      lastOled = html;
      oled.innerHTML = html;
      var mir = $('phOled'); if (mir) mir.innerHTML = html;
    }
    var b = S.mode === 'sleep' ? 0.35 : 0.35 + 0.65 * (S.brightness / 100);
    oled.style.opacity = b;
    $('ledR').classList.toggle('on', S.silent);
    $('ledY').classList.toggle('on', S.notes.length > 0);
    var g = $('ledG'); g.classList.toggle('on', true); g.classList.toggle('blink', S.mode === 'find' || !S.linked);
    $('phLinkTxt').textContent = S.linked && S.mode !== 'find' ? 'LINKED' : 'SEARCHING';
    $('phLinkDot').className = S.linked && S.mode !== 'find' ? '' : 'off';
  }

  /* ---------------- phone rendering ---------------- */
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function moodLbl() { var f = S.mode === 'sleep' ? 'asleep' : S.mode || shownFace(); return f.toUpperCase(); }
  function tog(on) { return '<span class="mini-oled' + (on ? ' on' : '') + '">' + (on ? 'ON' : 'OFF') + '</span>'; }

  var TABS = {
    home: function () {
      var row = SCREENS.map(function (s) {
        return '<button type="button" data-act="screen" data-v="' + s + '" aria-pressed="' + (S.screen === s && !S.popup) + '">' + SCREEN_LBL[s] + '</button>';
      }).join('');
      return '<section class="pcard2"><div class="pc-h"><h4>MOCHI.LIVE</h4><span>' + moodLbl() + '</span></div>' +
        '<div class="ph-oled"><svg id="phOled" viewBox="0 0 128 64" aria-label="Live mirror of the device screen" role="img">' + lastOled + '</svg></div>' +
        '<div class="seg5" role="group" aria-label="OLED screen">' + row + '</div></section>' +
        '<div class="tiles">' +
        '<div class="tile"><small>LINK</small><b>192.168.1.42</b></div>' +
        '<div class="tile"><small>WIFI</small><b><svg viewBox="0 0 16 12" width="30" height="22" aria-hidden="true" shape-rendering="crispEdges"><rect x="0" y="9" width="3" height="3"/><rect x="4" y="6" width="3" height="6"/><rect x="8" y="3" width="3" height="9"/><rect x="12" y="0" width="3" height="12"/></svg>-46 dBm</b></div>' +
        '<div class="tile"><small>UNREAD</small><b class="big">' + S.notes.length + '</b></div>' +
        '<div class="tile"><small>WEATHER</small><b>28°C ' + esc(S.city.slice(0, 3).toUpperCase()) + '</b></div></div>' +
        '<div class="row3">' +
        '<button type="button" class="pbtn" data-act="silent" aria-pressed="' + S.silent + '">' + (S.silent ? 'MUTED' : 'SOUND') + '</button>' +
        '<button type="button" class="pbtn" data-act="ping">PING</button>' +
        '<button type="button" class="pbtn" data-act="zzz" aria-pressed="' + (S.mode === 'sleep') + '">ZZZ</button></div>';
    },
    moods: function () {
      var cur = S.mood;
      return '<p class="ph-hint">Tap a face. Mochi changes instantly.</p><div class="moods">' +
        M.MOODS.map(function (m) {
          return '<button type="button" data-act="mood" data-v="' + m + '" aria-pressed="' + (m === cur) + '" aria-label="' + m + '"><svg viewBox="0 0 128 64" aria-hidden="true">' + M.face(m) + '</svg><span>' + m.toUpperCase() + '</span></button>';
        }).join('') + '</div>';
    },
    inbox: function () {
      var f = APPS.map(function (a) {
        return '<li><span>' + a + '</span><button type="button" class="tog" data-act="fwd" data-v="' + a + '" aria-pressed="' + S.forward[a] + '" aria-label="Forward ' + a + '">' + tog(S.forward[a]) + '</button></li>';
      }).join('');
      var log = S.log.length ? S.log.map(function (n) {
        return '<li class="' + (n.ok ? '' : 'blocked') + '"><div class="nl-h"><b>' + esc(n.app) + '</b><span>' + n.t + '</span></div><p><b>' + esc(n.title) + '</b> ' + esc(n.msg) + '</p><small>' + (n.ok ? '→ SENT TO MOCHI' : '× BLOCKED BY FILTER') + '</small></li>';
      }).join('') : '<li class="empty">No notifications yet. Send a test one.</li>';
      return '<section class="pcard2"><div class="pc-h"><h4>FORWARD FROM</h4></div><ul class="fwd">' + f + '</ul></section>' +
        '<div class="row2"><button type="button" class="pbtn pacc" data-act="test">SEND TEST</button><button type="button" class="pbtn" data-act="clearlog">CLEAR</button></div>' +
        '<section class="pcard2"><div class="pc-h"><h4>INBOX</h4><span>' + S.log.length + '</span></div><ul class="nlog">' + log + '</ul></section>';
    },
    voice: function () {
      var st = S.mode === 'listen' ? 'LISTENING...' : S.mode === 'think' ? 'THINKING' : S.mode === 'say' ? 'SPEAKING' : 'MIC READY';
      return '<section class="pcard2 voice"><div class="pc-h"><h4>VOICE</h4><span>' + st + '</span></div>' +
        '<div class="wave' + (S.mode === 'listen' ? ' live' : '') + '" aria-hidden="true">' + new Array(16).join('<i></i>') + '<i></i></div>' +
        '<button type="button" class="ptt" data-hold="ptt" aria-pressed="' + (S.mode === 'listen') + '">' + (S.tapMode && S.mode === 'listen' ? 'LISTENING · TAP TO STOP' : 'HOLD OR TAP TO TALK') + '</button>' +
        '<p class="heard">' + (S.heard ? 'YOU: "' + esc(S.heard) + '"' : '') + (S.lastReply ? '<br>MOCHI: ' + esc(S.lastReply) : '') + '</p>' +
        '<p class="ph-hint">' + (S.micNote ? esc(S.micNote) : 'Hold while you talk, or tap once and just speak. Try “what time is it”, “be happy” or “tell me a joke”.') + '</p></section>' +
        '<section class="pcard2"><div class="pc-h"><h4>TYPE TO MOCHI</h4></div>' +
        '<label class="vh" for="sayIn">Text for Mochi to say</label><input id="sayIn" class="pin-txt" maxlength="60" placeholder="what time is it?" value="' + esc(S.sayDraft) + '" data-in="say">' +
        '<div class="row2"><button type="button" class="pbtn pacc" data-act="ask">ASK MOCHI</button><button type="button" class="pbtn" data-act="say">SAY IT</button></div>' +
        '<p class="ph-hint">ASK = Mochi answers it. SAY IT = Mochi reads it out.</p></section>';
    },
    setup: function () {
      var th = ['light', 'dark', 'auto'].map(function (t) { return '<button type="button" data-act="ptheme" data-v="' + t + '" aria-pressed="' + (S.ptheme === t) + '">' + t.toUpperCase() + '</button>'; }).join('');
      return '<section class="pcard2"><div class="pc-h"><h4>CONNECTION</h4><span>' + (S.linked ? 'LINKED' : 'NOT LINKED') + '</span></div>' +
        '<div class="kv"><small>HOST</small><span>deskbuddy.local</span></div><div class="kv"><small>PORT</small><span>81</span></div>' +
        '<button type="button" class="pbtn wide" data-act="find">FIND</button></section>' +
        '<section class="pcard2"><div class="pc-h"><h4>DEVICE</h4></div>' +
        '<label class="rng"><small>VOLUME <b>' + S.volume + '</b></small><input type="range" min="0" max="100" step="10" value="' + S.volume + '" data-in="volume"></label>' +
        '<label class="rng"><small>BRIGHTNESS <b>' + S.brightness + '</b></small><input type="range" min="10" max="100" step="10" value="' + S.brightness + '" data-in="brightness"></label>' +
        '<div class="kv"><small>THEME</small></div><div class="seg3" role="group" aria-label="App theme">' + th + '</div></section>' +
        '<section class="pcard2"><div class="pc-h"><h4>WEATHER</h4></div><label class="vh" for="cityIn">City</label>' +
        '<input id="cityIn" class="pin-txt" maxlength="20" value="' + esc(S.cityDraft) + '" data-in="city">' +
        '<button type="button" class="pbtn pacc wide" data-act="city">SAVE TO DESKBUDDY</button></section>';
    }
  };

  function renderPhone() {
    if (holding) return;
    var a = document.activeElement, focusId = a && phone.contains(a) ? (a.id || (a.dataset && (a.dataset.act + ':' + (a.dataset.v || '')))) : null;
    var st = phBody.scrollTop;
    phBody.innerHTML = TABS[S.tab]();
    phBody.scrollTop = st;
    if (focusId) {
      var el = $(focusId);
      if (!el && focusId.indexOf(':') > 0) {
        var p = focusId.split(':');
        el = phBody.querySelector('[data-act="' + p[0] + '"]' + (p[1] ? '[data-v="' + p[1] + '"]' : ''));
      }
      if (el) el.focus({ preventScroll: true });
    }
    Array.prototype.forEach.call($('phTabs').children, function (b) { b.setAttribute('aria-pressed', b.dataset.tab === S.tab); });
    var pt = S.ptheme === 'auto' ? (document.documentElement.getAttribute('data-theme') || 'light') : S.ptheme;
    phone.setAttribute('data-ptheme', pt);
  }
  function render() { renderDevice(); renderPhone(); }

  /* ---------------- behaviour ---------------- */
  function touched() {
    audio();
    var wasAsleep = S.mode === 'sleep' || S.idle > 0;
    S.idle = 0; idleT = 0;
    if (S.mode === 'sleep') { S.mode = null; react('surprised', 700); }
    else if (wasAsleep) render();
  }
  function react(face, ms) {
    S.react = face; renderDevice();
    later('react', ms, function () { S.react = null; render(); });
  }
  function setScreen(s) { S.screen = s; S.popup = null; if (s === 'notify') S.noteIdx = 0; SFX.screen(); }

  function notifyDevice(n) {
    S.notes.unshift(n); S.noteIdx = 0;
    if (S.notes.length > 9) S.notes.pop();
    S.popup = n; SFX.notify();
    render();
    later('popup', 4200, function () { S.popup = null; render(); });
    state({ unread: S.notes.length });
  }

  /* ---------------- real voice: mic level, speech-to-text, spoken replies ---------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var mic = { stream: null, an: null, buf: null, raf: 0, rec: null, text: '', heard: false, live: false };

  function micStart() {
    if (!SR && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)) { S.micNote = 'No microphone access in this browser.'; return; }
    var ctx = audio(); if (!ctx) return;
    var go = function (stream) {
      if (S.mode !== 'listen') { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      mic.stream = stream; mic.live = true;
      var src = ctx.createMediaStreamSource(stream);
      mic.an = ctx.createAnalyser(); mic.an.fftSize = 512; mic.buf = new Uint8Array(mic.an.frequencyBinCount);
      src.connect(mic.an);
      var last = 0;
      (function tick(t) {
        if (!mic.an) return;
        mic.raf = requestAnimationFrame(tick);
        if (t - last < 66) return; last = t;
        mic.an.getByteFrequencyData(mic.buf);
        var lv = [], step = Math.floor(mic.buf.length / 3 / 8);
        for (var i = 0; i < 8; i++) { var sum = 0; for (var k = 0; k < step; k++) sum += mic.buf[i * step + k]; lv.push(Math.min(1, sum / step / 150)); }
        S.levels = lv;
        var w = phBody.querySelector('.wave');
        if (w) Array.prototype.forEach.call(w.children, function (b, j) { b.style.height = (6 + lv[j % 8] * 38) + 'px'; });
        renderDevice();
      })(0);
    };
    if (!SR) navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(go, function () {
      S.micNote = 'Microphone blocked — allow it in the address bar to talk to Mochi.'; logEl.textContent = 'MIC  permission denied — using a placeholder reply';
    });
    if (SR) {
      try {
        var r = new SR(); mic.rec = r; mic.text = ''; mic.heard = false; S.sttErr = null;
        r.lang = S.sttLang || 'en-US'; r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
        r.onaudiostart = function () { mic.live = true; logEl.textContent = 'MIC  listening… speak now'; };
        r.onspeechstart = function () { logEl.textContent = 'MIC  hearing you…'; };
        r.onend = function () {
          // some browsers stop by themselves after a pause: restart while the button is still active
          if (mic.rec === r && S.mode === 'listen' && !mic.text) { try { r.start(); } catch (e) {} }
          else if (mic.rec === r && S.mode === 'listen' && S.tapMode) { S.tapMode = false; endListen(S.tapSrc || 'app'); }
        };
        r.onresult = function (e) {
          var t = '', fin = false; for (var i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) fin = true; }
          mic.text = t.trim(); mic.heard = true;
          if (fin && S.tapMode) later('tapend', 500, function () { if (S.tapMode && S.mode === 'listen') { S.tapMode = false; endListen(S.tapSrc || 'app'); } });
          var el = phBody.querySelector('.heard'); if (el) el.textContent = '"' + mic.text + '"';
          logEl.textContent = 'STT  ' + mic.text;
        };
        r.onerror = function (e) {
          if (e.error === 'aborted' || e.error === 'no-speech') return;
          S.sttErr = e.error;
          S.micNote = e.error === 'network' ? 'Word recognition needs internet (and works best on the live https site).'
            : (e.error === 'not-allowed' || e.error === 'service-not-allowed') ? 'This browser blocked word recognition here — try Chrome or Edge on the live site.'
            : e.error === 'audio-capture' ? 'No microphone found — check Windows sound settings.'
            : e.error === 'language-not-supported' ? 'Speech language not supported here.'
            : 'Word recognition error: ' + e.error + '.';
          logEl.textContent = 'STT  error: ' + e.error;
        };
        r.start();
      } catch (er) { mic.rec = null; }
    }
  }
  function micStop(cb) {
    cancelAnimationFrame(mic.raf); mic.an = null; S.levels = null;
    if (mic.stream) { mic.stream.getTracks().forEach(function (t) { t.stop(); }); mic.stream = null; }
    var wasLive = mic.live; mic.live = false;
    if (mic.rec) {
      var r = mic.rec, done = false; mic.rec = null;
      var fin = function () { if (done) return; done = true; cb(mic.text, wasLive); };
      r.onend = fin; r.onerror = function (e) { if (e.error !== 'aborted' && e.error !== 'no-speech') { S.sttErr = e.error; logEl.textContent = 'STT  error: ' + e.error; } fin(); };
      try { r.stop(); } catch (e) { fin(); }
      setTimeout(fin, 1500);
    } else { if (!SR) S.sttErr = 'unsupported'; cb('', wasLive); }
  }

  function pad0(n) { return (n < 10 ? '0' : '') + n; }
  function brain(t) {
    var x = t.toLowerCase(), d = new Date(), h = d.getHours();
    var moods = { happy: 'happy', sad: 'sad', angry: 'angry', love: 'love', sleepy: 'sleepy', dizzy: 'dizzy', cat: 'cat', star: 'star', wink: 'wink', smug: 'smug', nervous: 'nervous', cute: 'cute', surprised: 'surprised' };
    if (!x) return { say: "Hmm, I didn't catch that. Try again?" };
    for (var m in moods) if (x.indexOf(m) > -1) return { say: 'Okay! Feeling ' + m + ' now.', mood: moods[m] };
    if (/\btime\b/.test(x)) return { say: "It's " + ((h % 12) || 12) + ':' + pad0(d.getMinutes()) + (h < 12 ? ' AM.' : ' PM.') };
    if (/weather|temperature|hot|cold|rain/.test(x)) return { say: "It's 28 degrees and partly cloudy in " + S.city + '. Demo weather, but I tried.', screen: 'weather' };
    if (/who (made|built|created)|your (maker|creator)|parinith/.test(x)) return { say: 'Parinith built me. An ESP32, a tiny OLED, and a lot of debugging.' };
    if (/your name|who are you|what are you/.test(x)) return { say: "I'm Mochi, Parinith's desk buddy." };
    if (/joke|funny/.test(x)) return { say: 'Why did the capacitor quit? It was tired of being charged for everything.' };
    if (/notif|message|inbox/.test(x)) return { say: 'Here is a test notification.', act: 'test' };
    if (/focus|pomodoro|timer|study/.test(x)) return { say: 'Focus mode. Twenty five minutes, go!', pomo: true };
    if (/sleep|good ?night|bye/.test(x)) return { say: 'Good night!', sleep: true };
    if (/hello|hi\b|hey|namaste/.test(x)) return { say: 'Hi! Nice to meet you. Hold the button and ask me the time.' };
    if (/how are you/.test(x)) return { say: 'Running at thirty frames per second. Feeling great.' };
    return { say: 'You said: ' + t + '. My real assistant plugs in here soon.' };
  }

  function startListen(src) {
    S.mode = 'listen'; S.levels = null; S.heard = ''; SFX.listen();
    if (src === 'app') send('a2d', { type: 'ptt', on: true });
    later('ptts', 250, function () { send('d2a', { type: 'ptt_start', rate: 16000, format: 's16le' }); });
    render();
    micStart();
  }
  function endListen(src) {
    if (S.mode !== 'listen') return;
    S.tapMode = false; clearTimeout(timers.tapmax);
    SFX.listenEnd();
    if (src === 'app') send('a2d', { type: 'ptt', on: false });
    S.mode = 'think'; render();
    later('ptte', 200, function () { send('d2a', { type: 'ptt_end' }); });
    var t0 = Date.now();
    micStop(function (text, wasLive) {
      S.heard = text;
      var r;
      if (text) r = brain(text);
      else if (!wasLive) r = { say: "I didn't hear anything. Check the mic is allowed, or type your question below." };
      else if (S.sttErr === 'unsupported') r = { say: "I can hear you, but this browser can't turn speech into words. Try Chrome or Edge." };
      else if (S.sttErr) r = { say: "I can hear you, but I couldn't make out the words here. Try the live site in Chrome or Edge." };
      else r = brain('');
      later('voice', Math.max(300, 900 - (Date.now() - t0)), function () {
        if (r.mood) { S.mood = r.mood; send('a2d', { type: 'face', name: r.mood }); }
        if (r.screen) S.screen = r.screen;
        if (r.pomo) { S.screen = 'pomo'; S.pomoRun = true; }
        speak(r.say, function () {
          if (r.act) ACT[r.act]();
          if (r.sleep) { S.mode = 'sleep'; }
          if (r.mood) S.screen = 'mochi';
          render();
        });
      });
    });
  }

  var ttsVoice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices(), en = vs.filter(function (v) { return /^en/i.test(v.lang); });
    ttsVoice = en.filter(function (v) { return /female|zira|samantha|google uk english female|aria|jenny|heera/i.test(v.name); })[0] || en[0] || vs[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speak(text, after) {
    S.mode = 'say'; S.sayText = text; S.react = null; S.lastReply = text;
    send('a2d', { type: 'say_start', rate: 16000 });
    render();
    var n = 0, ended = false;
    clearInterval(timers.blips);
    var useTts = soundOn && !S.silent && S.volume > 0 && window.speechSynthesis && window.SpeechSynthesisUtterance;
    timers.blips = setInterval(function () { S.speakFrame = (++n) % 2; if (!useTts && n % 2) SFX.blip(); renderDevice(); }, 200);
    function end() {
      if (ended) return; ended = true;
      clearInterval(timers.blips); clearTimeout(timers.say);
      if (S.mode === 'say') S.mode = null;
      S.sayText = ''; send('a2d', { type: 'say_end' }); render();
      if (after) after();
    }
    if (useTts) {
      try {
        if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        window.__mochiUtter = u; // keep a reference (Chrome drops unreferenced utterances)
        if (ttsVoice) u.voice = ttsVoice;
        u.pitch = 1.6; u.rate = 1.05; u.volume = S.volume / 100;
        var t0 = Date.now();
        u.onend = function () { if (Date.now() - t0 > 600) end(); };
        u.onerror = function () { useTts = false; };
        setTimeout(function () { speechSynthesis.resume(); speechSynthesis.speak(u); }, 60);
        later('say', 2600 + text.length * 95, function () { if (!useTts || !speechSynthesis.speaking) end(); else later('say', 6000, end); });
        return;
      } catch (e) {}
    }
    later('say', 2600 + text.length * 95, end);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  var ACT = {
    screen: function (v) { setScreen(v); send('a2d', { type: 'screen', name: v === 'pomo' ? 'pomodoro' : v }); state(); },
    silent: function () { S.silent = !S.silent; send('a2d', { type: 'set', key: 'silent', value: S.silent }); if (!S.silent) SFX.click(); state(); },
    ping: function () { send('a2d', { type: 'ping' }); later('pong', 420, function () { send('d2a', { type: 'pong' }); SFX.pong(); }); react('surprised', 900); },
    zzz: function () {
      if (S.mode === 'sleep') { S.mode = null; send('a2d', { type: 'face', name: 'idle' }); react('surprised', 600); }
      else { S.mode = 'sleep'; send('a2d', { type: 'face', name: 'sleep' }); }
      state();
    },
    mood: function (v) { S.mood = v; S.screen = 'mochi'; S.popup = null; S.react = null; SFX.mood(); send('a2d', { type: 'face', name: v }); state(); },
    fwd: function (v) { S.forward[v] = !S.forward[v]; },
    test: function () {
      var s = SAMPLES[S.sample++ % SAMPLES.length], d = new Date();
      var n = { app: s.app, title: s.title, msg: s.msg, t: pad2(d.getHours()) + ':' + pad2(d.getMinutes()), ok: !!S.forward[s.app] };
      S.log.unshift(n); if (S.log.length > 12) S.log.pop();
      if (n.ok) { send('a2d', { type: 'notify', app: n.app, title: n.title, body: n.msg }); later('nd', 300, function () { notifyDevice(n); }); }
      else logEl.textContent = 'APP  ' + s.app + ' blocked by the per-app filter — nothing sent';
    },
    clearlog: function () { S.log = []; },
    say: function () {
      var t = (S.sayDraft || '').trim() || 'Hello from the app';
      speak(t);
    },
    ask: function () {
      var t = (S.sayDraft || '').trim() || 'what time is it';
      var r = brain(t); S.heard = t; S.mode = 'think'; render();
      later('ask', 600, function () {
        if (r.mood) { S.mood = r.mood; send('a2d', { type: 'face', name: r.mood }); }
        if (r.screen) S.screen = r.screen;
        if (r.pomo) { S.screen = 'pomo'; S.pomoRun = true; }
        speak(r.say, function () { if (r.act) ACT[r.act](); if (r.sleep) S.mode = 'sleep'; if (r.mood) S.screen = 'mochi'; render(); });
      });
    },
    ptheme: function (v) { S.ptheme = v; },
    find: function () {
      S.mode = 'find'; S.linked = false; render();
      logEl.textContent = 'APP  mDNS lookup _deskbuddy._tcp ...';
      later('find', 1600, function () { S.mode = null; S.linked = true; send('a2d', { type: 'hello', name: 'phone' }); later('hello', 380, function () { send('d2a', { type: 'hello', device: 'DeskBuddy', fw: '2.0.0-dev' }); }); render(); });
    },
    city: function () {
      S.city = (S.cityDraft || '').trim() || 'Bengaluru';
      send('a2d', { type: 'set', key: 'owm_city', value: S.city, save: true });
      setScreen('weather'); state({ city: S.city });
    }
  };

  phBody.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    touched();
    ACT[b.dataset.act](b.dataset.v);
    render();
  });
  phBody.addEventListener('input', function (e) {
    var k = e.target.dataset.in; if (!k) return;
    if (k === 'say') S.sayDraft = e.target.value;
    else if (k === 'city') S.cityDraft = e.target.value;
    else {
      S[k] = +e.target.value;
      var lb = e.target.parentNode.querySelector('b'); if (lb) lb.textContent = S[k];
      renderDevice();
      later('set' + k, 250, function () { send('a2d', { type: 'set', key: k === 'brightness' ? 'bright' : k, value: S[k] }); if (k === 'volume') { audio(); SFX.click(); } });
    }
  });
  phBody.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.dataset.in === 'say') { touched(); ACT.ask(); render(); }
    if (e.key === 'Enter' && e.target.dataset.in === 'city') { touched(); ACT.city(); render(); }
  });
  $('phTabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    audio(); S.tab = b.dataset.tab; SFX.click(); phBody.scrollTop = 0; renderPhone();
  });

  /* hold-to-talk in the app */
  var holding = null, downAt = 0;
  function pttDown(e) {
    var b = e.target.closest('[data-hold="ptt"]'); if (!b || holding) return;
    if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
    if (e.type === 'keydown' && e.repeat) return;
    e.preventDefault();
    if (S.tapMode && S.mode === 'listen') { S.tapMode = false; clearTimeout(timers.tapmax); endListen('app'); renderPhone(); return; }
    touched(); holding = 'app'; downAt = Date.now(); b.setAttribute('aria-pressed', 'true'); b.classList.add('down');
    var w = phBody.querySelector('.wave'); if (w) w.classList.add('live');
    startListen('app');
  }
  function pttUp() {
    if (holding !== 'app') return;
    holding = null;
    if (Date.now() - downAt < 450 && S.mode === 'listen') {
      // quick tap: keep listening until you stop talking (or tap again)
      S.tapMode = true; S.tapSrc = 'app';
      later('tapmax', 8000, function () { if (S.tapMode && S.mode === 'listen') { S.tapMode = false; endListen('app'); } });
      renderPhone();
      return;
    }
    endListen('app'); renderPhone();
  }
  phBody.addEventListener('pointerdown', pttDown);
  phBody.addEventListener('keydown', pttDown);
  window.addEventListener('pointerup', pttUp);
  window.addEventListener('pointercancel', pttUp);
  phBody.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') pttUp(); });
  phBody.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-hold]')) e.preventDefault(); });

  /* ---------------- hardware buttons: click / hold ---------------- */
  function hw(el, onClick, onHold, onRelease) {
    var t = null, long = false, down = false;
    function start(e) {
      if (e.type === 'keydown') { if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat) return; e.preventDefault(); }
      if (down) return; down = true; long = false; touched();
      el.classList.add('down');
      t = setTimeout(function () { long = true; onHold && onHold(); }, 550);
    }
    function end(e) {
      if (!down) return;
      if (e && e.type === 'keyup' && e.key !== ' ' && e.key !== 'Enter') return;
      down = false; clearTimeout(t); el.classList.remove('down');
      if (long) { onRelease && onRelease(); } else onClick();
      render();
    }
    el.addEventListener('pointerdown', function (e) { el.setPointerCapture && el.setPointerCapture(e.pointerId); start(e); });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', function () { if (down) { down = false; clearTimeout(t); el.classList.remove('down'); if (long && onRelease) onRelease(); render(); } });
    el.addEventListener('keydown', start);
    el.addEventListener('keyup', end);
    el.addEventListener('blur', function () { if (down) end(); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }
  function btnEvt(n, a) { send('d2a', { type: 'button', btn: n, action: a }); }

  hw($('btn1'), function () {
    btnEvt(1, 'click');
    if (S.screen === 'notify' && S.notes.length && !S.popup) { S.noteIdx = (S.noteIdx + 1) % S.notes.length; SFX.click(); }
    else {
      var i = M.MOODS.indexOf(S.mood); S.mood = M.MOODS[(i + 1) % M.MOODS.length];
      S.screen = 'mochi'; S.popup = null; S.react = null; SFX.mood(); state();
    }
  }, function () {
    btnEvt(1, 'long'); S.notes = []; S.noteIdx = 0; S.popup = null; SFX.listenEnd(); state({ unread: 0 }); render();
  });

  hw($('btn2'), function () {
    btnEvt(2, 'click');
    if (S.popup) { S.popup = null; }
    var i = SCREENS.indexOf(S.screen); setScreen(SCREENS[(i + 1) % SCREENS.length]); state();
  }, function () {
    btnEvt(2, 'long'); S.silent = !S.silent; if (!S.silent) SFX.click(); state(); render();
  });

  hw($('btn3'), function () {
    btnEvt(3, 'click');
    if (S.screen === 'pomo') { S.pomoRun = !S.pomoRun; SFX.click(); }
    else if (S.screen === 'weather') { SFX.click(); logEl.textContent = 'DEV  weather refresh → api.openweathermap.org (demo data here)'; }
    else { S.screen = 'mochi'; S.popup = null; react('wink', 900); SFX.wink(); }
  }, function () {
    btnEvt(3, 'long'); startListen('dev');
  }, function () {
    btnEvt(3, 'release'); endListen('dev');
  });

  hw($('touchPad'), function () {
    send('d2a', { type: 'touch' });
    S.screen = 'mochi'; S.popup = null;
    S.pats = (S.pats || 0) + 1;
    react(S.pats % 2 ? 'love' : 'cute', 1500); SFX.purr();
  });

  /* ---------------- clocks: pomodoro, idle, blink ---------------- */
  var idleT = 0, visible = false;
  setInterval(function () {
    if (S.pomoRun) {
      S.pomoLeft--;
      if (S.pomoLeft <= 0) { S.pomoRun = false; S.pomoLeft = 1500; SFX.timer(); react('star', 1800); }
    }
    if (visible && !S.mode && !holding) {
      idleT++;
      if (idleT === 25) { S.idle = 1; render(); }
      if (idleT === 45) { S.mode = 'sleep'; S.idle = 0; send('d2a', { type: 'state', face: 'sleep' }); render(); }
    }
    if (S.screen === 'clock' || S.pomoRun || S.popup || S.mode) renderDevice();
  }, 1000);

  (function blinkLoop() {
    setTimeout(function () {
      if (!S.react && !S.mode && S.screen === 'mochi' && !S.popup) {
        S.blink = true; renderDevice();
        setTimeout(function () { S.blink = false; renderDevice(); }, 130);
      }
      blinkLoop();
    }, 2800 + Math.random() * 3200);
  })();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { idleT = 0; }
    }, { threshold: 0.25 }).observe(root);
  } else visible = true;

  /* ---------------- top controls ---------------- */
  var sBtn = $('simSound');
  sBtn.addEventListener('click', function () {
    soundOn = !soundOn; sBtn.setAttribute('aria-pressed', soundOn); sBtn.textContent = 'SOUND: ' + (soundOn ? 'ON' : 'OFF');
    if (soundOn) { audio(); SFX.click(); }
  });
  $('simReset').addEventListener('click', function () {
    for (var k in timers) { clearTimeout(timers[k]); clearInterval(timers[k]); }
    try { speechSynthesis.cancel(); } catch (e) {}
    S = initial(); holding = null; idleT = 0; lastOled = '';
    logEl.textContent = 'RESET · TAP ANYTHING'; render();
  });

  // keep the phone theme in step with the page theme when set to AUTO
  new MutationObserver(function () { if (S.ptheme === 'auto') renderPhone(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  render();
  window.DeskSim = { get state() { return S; } };
})();

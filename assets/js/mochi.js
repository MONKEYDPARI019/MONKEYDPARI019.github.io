/* Mochi — faces and 128×64 OLED screens, shared by the hero, the pinned
   walkthrough and the simulator. Face drawings match the DeskBuddy app. */
(function () {
  'use strict';

  var F = {
    default:'<rect x="10" y="6" width="46" height="40" rx="9" fill="P"/><rect x="72" y="6" width="46" height="40" rx="9" fill="P"/><g class="pupil"><circle cx="33" cy="26" r="7" fill="S"/><circle cx="31" cy="24" r="2" fill="P"/><circle cx="95" cy="26" r="7" fill="S"/><circle cx="93" cy="24" r="2" fill="P"/></g><rect x="52" y="54" width="24" height="3" fill="P"/>',
    happy:'<path d="M12 36 Q33 6 54 36" stroke="P" stroke-width="6" fill="none"/><path d="M74 36 Q95 6 116 36" stroke="P" stroke-width="6" fill="none"/><path d="M50 50 Q64 61 78 50" stroke="P" stroke-width="3" fill="none"/>',
    love:'<circle cx="25" cy="22" r="8" fill="P"/><circle cx="41" cy="22" r="8" fill="P"/><polygon points="17,25 49,25 33,42" fill="P"/><circle cx="87" cy="22" r="8" fill="P"/><circle cx="103" cy="22" r="8" fill="P"/><polygon points="79,25 111,25 95,42" fill="P"/><path d="M50 50 Q64 61 78 50" stroke="P" stroke-width="3" fill="none"/>',
    star:'<polygon points="33,7 37.7,19.5 51.1,20.1 40.6,28.5 44.2,41.4 33,34 21.8,41.4 25.4,28.5 14.9,20.1 28.3,19.5" fill="P"/><polygon points="95,7 99.7,19.5 113.1,20.1 102.6,28.5 106.2,41.4 95,34 83.8,41.4 87.4,28.5 76.9,20.1 90.3,19.5" fill="P"/><path d="M50 50 Q64 61 78 50" stroke="P" stroke-width="3" fill="none"/>',
    wink:'<rect x="12" y="26" width="42" height="5" fill="P"/><rect x="72" y="6" width="46" height="40" rx="9" fill="P"/><g class="pupil"><circle cx="95" cy="26" r="7" fill="S"/><circle cx="93" cy="24" r="2" fill="P"/></g><path d="M50 50 Q64 61 78 50" stroke="P" stroke-width="3" fill="none"/>',
    dizzy:'<path d="M18 12 L48 40 M48 12 L18 40 M80 12 L110 40 M110 12 L80 40" stroke="P" stroke-width="6" fill="none"/><path d="M48 56 q4 -5 8 0 q4 5 8 0 q4 -5 8 0 q4 5 8 0" stroke="P" stroke-width="3" fill="none"/>',
    angry:'<polygon points="10,10 56,24 56,46 10,46" fill="P"/><polygon points="72,24 118,10 118,46 72,46" fill="P"/><g class="pupil"><circle cx="35" cy="34" r="6" fill="S"/><circle cx="33" cy="32" r="2" fill="P"/><circle cx="93" cy="34" r="6" fill="S"/><circle cx="91" cy="32" r="2" fill="P"/></g><rect x="48" y="55" width="32" height="4" fill="P"/>',
    sad:'<polygon points="10,24 56,12 56,46 10,46" fill="P"/><polygon points="72,12 118,24 118,46 72,46" fill="P"/><g class="pupil"><circle cx="33" cy="36" r="6" fill="S"/><circle cx="31" cy="34" r="2" fill="P"/><circle cx="95" cy="36" r="6" fill="S"/><circle cx="93" cy="34" r="2" fill="P"/></g><path d="M50 59 Q64 49 78 59" stroke="P" stroke-width="3" fill="none"/>',
    sleepy:'<rect x="10" y="28" width="46" height="18" rx="4" fill="P"/><rect x="72" y="28" width="46" height="18" rx="4" fill="P"/><g class="pupil"><circle cx="33" cy="40" r="5" fill="S"/><circle cx="31" cy="38" r="2" fill="P"/><circle cx="95" cy="40" r="5" fill="S"/><circle cx="93" cy="38" r="2" fill="P"/></g><rect x="56" y="55" width="16" height="3" fill="P"/>',
    surprised:'<circle cx="33" cy="26" r="19" stroke="P" stroke-width="4" fill="none"/><circle cx="95" cy="26" r="19" stroke="P" stroke-width="4" fill="none"/><g class="pupil"><circle cx="33" cy="26" r="7" fill="P"/><circle cx="95" cy="26" r="7" fill="P"/></g><circle cx="64" cy="55" r="5" stroke="P" stroke-width="3" fill="none"/>',
    smug:'<rect x="10" y="24" width="46" height="22" rx="4" fill="P"/><rect x="72" y="24" width="46" height="22" rx="4" fill="P"/><g class="pupil"><circle cx="37" cy="38" r="6" fill="S"/><circle cx="35" cy="36" r="2" fill="P"/><circle cx="99" cy="38" r="6" fill="S"/><circle cx="97" cy="36" r="2" fill="P"/></g><path d="M52 55 Q68 59 80 50" stroke="P" stroke-width="3" fill="none"/>',
    nervous:'<rect x="14" y="10" width="38" height="32" rx="7" fill="P"/><rect x="76" y="10" width="38" height="32" rx="7" fill="P"/><g class="pupil"><circle cx="33" cy="28" r="5" fill="S"/><circle cx="31" cy="26" r="2" fill="P"/><circle cx="95" cy="28" r="5" fill="S"/><circle cx="93" cy="26" r="2" fill="P"/></g><path d="M122 4 L126 12 Q122 17 118 12 Z" fill="P"/><path d="M48 55 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3 l4 -3 l4 3" stroke="P" stroke-width="2" fill="none"/>',
    cat:'<circle cx="33" cy="26" r="19" fill="P"/><circle cx="95" cy="26" r="19" fill="P"/><g class="pupil"><ellipse cx="33" cy="26" rx="3" ry="13" fill="S"/><ellipse cx="95" cy="26" rx="3" ry="13" fill="S"/></g><path d="M56 52 q4 6 8 0 q4 6 8 0" stroke="P" stroke-width="3" fill="none"/>',
    sleeping:'<path d="M12 28 Q33 40 54 28" stroke="P" stroke-width="5" fill="none"/><path d="M74 28 Q95 40 116 28" stroke="P" stroke-width="5" fill="none"/><rect x="58" y="55" width="12" height="3" fill="P"/><text class="zz" x="104" y="12" font-size="9" font-family="\'Press Start 2P\', monospace" fill="P">z</text><text class="zz" x="114" y="6" font-size="6" font-family="\'Press Start 2P\', monospace" fill="P">z</text>',
    cute:'<circle cx="33" cy="26" r="20" fill="P"/><circle cx="95" cy="26" r="20" fill="P"/><g class="pupil"><circle cx="33" cy="28" r="11" fill="S"/><circle cx="95" cy="28" r="11" fill="S"/><circle cx="29" cy="24" r="4" fill="P"/><circle cx="91" cy="24" r="4" fill="P"/></g><rect x="10" y="50" width="3" height="3" fill="P"/><rect x="16" y="50" width="3" height="3" fill="P"/><rect x="109" y="50" width="3" height="3" fill="P"/><rect x="115" y="50" width="3" height="3" fill="P"/><path d="M50 50 Q64 61 78 50" stroke="P" stroke-width="3" fill="none"/>',
    listen:'<circle cx="33" cy="26" r="19" stroke="P" stroke-width="4" fill="none"/><circle cx="95" cy="26" r="19" stroke="P" stroke-width="4" fill="none"/><circle cx="33" cy="20" r="7" fill="P"/><circle cx="95" cy="20" r="7" fill="P"/><rect x="54" y="53" width="20" height="6" rx="3" fill="P"/>',
    blink:'<rect x="12" y="25" width="42" height="5" fill="P"/><rect x="74" y="25" width="42" height="5" fill="P"/><rect x="52" y="54" width="24" height="3" fill="P"/>',
    think:'<rect x="10" y="10" width="46" height="34" rx="8" fill="P"/><rect x="72" y="10" width="46" height="34" rx="8" fill="P"/><circle cx="40" cy="20" r="6" fill="S"/><circle cx="102" cy="20" r="6" fill="S"/><rect x="56" y="54" width="16" height="3" fill="P"/>'
  };
  var MOODS = ['default','happy','love','star','wink','dizzy','angry','sad','sleepy','surprised','smug','nervous','cat','sleeping','cute'];

  function paint(s) { return s.replace(/"P"/g, '"#ffffff"').replace(/"S"/g, '"#000000"'); }
  function face(m) { return paint(F[m] || F.default); }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var T = 'font-family="VT323, monospace" fill="#ffffff"';
  var PX = 'font-family="\'Press Start 2P\', monospace" fill="#ffffff"';

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function statusBar(o) {
    var s = '';
    // wifi bars
    s += '<rect x="2" y="7" width="2" height="2" fill="#fff"/><rect x="5" y="5" width="2" height="4" fill="#fff"/><rect x="8" y="3" width="2" height="6" fill="#fff"/><rect x="11" y="1" width="2" height="8" fill="#fff"/>';
    if (o.silent) s += '<text x="18" y="9" ' + PX + ' font-size="6">S</text>';
    if (o.unread) s += '<rect x="104" y="1" width="22" height="9" fill="#fff"/><text x="115" y="9" font-family="VT323, monospace" font-size="10" fill="#000" text-anchor="middle">' + Math.min(o.unread, 99) + '</text>';
    return s;
  }

  var SCREENS = {
    clock: function (o) {
      var d = o.now || new Date();
      var colon = (d.getSeconds() % 2 === 0) ? ':' : ' ';
      return statusBar(o) +
        '<text x="64" y="42" ' + T + ' font-size="40" text-anchor="middle">' + pad(d.getHours()) + colon + pad(d.getMinutes()) + '</text>' +
        '<text x="64" y="58" ' + PX + ' font-size="6" text-anchor="middle">' + DAYS[d.getDay()] + ' ' + pad(d.getDate()) + ' ' + MON[d.getMonth()] + '</text>';
    },
    weather: function (o) {
      var city = esc((o.city || 'Bengaluru').toUpperCase().slice(0, 12));
      return statusBar(o) +
        // pixel sun behind a cloud
        '<g fill="#fff"><rect x="18" y="16" width="12" height="12"/><rect x="22" y="12" width="4" height="2"/><rect x="14" y="20" width="2" height="4"/><rect x="32" y="20" width="2" height="4"/><rect x="15" y="13" width="2" height="2"/><rect x="31" y="13" width="2" height="2"/>' +
        '<rect x="12" y="30" width="30" height="10"/><rect x="16" y="26" width="10" height="4"/><rect x="26" y="24" width="10" height="6"/><rect x="8" y="34" width="4" height="6"/></g>' +
        '<rect x="20" y="28" width="6" height="2" fill="#000"/>' +
        '<text x="88" y="36" ' + T + ' font-size="30" text-anchor="middle">' + (o.temp || 28) + '°C</text>' +
        '<text x="88" y="47" ' + T + ' font-size="11" text-anchor="middle">PARTLY CLOUDY</text>' +
        '<text x="64" y="61" ' + PX + ' font-size="5" text-anchor="middle">' + city + (o.demo ? ' · DEMO' : '') + '</text>';
    },
    mochi: function (o) { return face(o.mood || 'happy'); },
    notify: function (o) {
      var n = o.note;
      if (!n) {
        return statusBar(o) + '<text x="64" y="34" ' + PX + ' font-size="7" text-anchor="middle">INBOX EMPTY</text>' +
          '<text x="64" y="48" ' + T + ' font-size="12" text-anchor="middle">nothing to see here</text>';
      }
      var msg = esc(n.msg || '');
      var w = Math.max(128, msg.length * 6 + 40);
      return '<rect x="0" y="0" width="128" height="13" fill="#fff"/>' +
        '<text x="4" y="10" font-family="\'Press Start 2P\', monospace" font-size="6" fill="#000">' + esc(n.app.toUpperCase().slice(0, 12)) + '</text>' +
        (o.count ? '<text x="124" y="11" font-family="VT323, monospace" font-size="11" fill="#000" text-anchor="end">' + o.idx + '/' + o.count + '</text>' : '') +
        '<text x="4" y="30" ' + T + ' font-size="15">' + esc((n.title || '').slice(0, 20)) + '</text>' +
        '<svg x="0" y="36" width="128" height="20" viewBox="0 0 128 20"><text class="' + (msg.length > 22 ? 'marq' : '') + '" x="4" y="14" ' + T + ' font-size="13" style="--mw:' + w + 'px">' + msg + '</text></svg>' +
        '<rect x="4" y="58" width="120" height="1" fill="#fff" opacity=".5"/>';
    },
    pomo: function (o) {
      var total = 25 * 60, left = o.pomoLeft == null ? total : o.pomoLeft;
      var mm = pad(Math.floor(left / 60)), ss = pad(left % 60);
      var done = Math.round((1 - left / total) * 30);
      var bar = '';
      for (var i = 0; i < 30; i++) bar += '<rect x="' + (4 + i * 4) + '" y="50" width="3" height="6" fill="#fff" opacity="' + (i < done ? 1 : .25) + '"/>';
      return statusBar(o) +
        '<text x="64" y="11" ' + PX + ' font-size="6" text-anchor="middle">' + (o.pomoRun ? 'FOCUS' : (left === total ? 'POMODORO' : 'PAUSED')) + '</text>' +
        '<text x="64" y="42" ' + T + ' font-size="34" text-anchor="middle">' + mm + ':' + ss + '</text>' + bar;
    },
    say: function (o) {
      var msg = esc(o.sayText || '');
      var w = Math.max(128, msg.length * 7 + 40);
      return '<g transform="translate(32 0) scale(.5)">' + face(o.speakFrame ? 'happy' : 'default') + '</g>' +
        '<svg x="0" y="38" width="128" height="24" viewBox="0 0 128 24"><text class="' + (msg.length > 18 ? 'marq' : '') + '" x="4" y="17" ' + T + ' font-size="16" style="--mw:' + w + 'px">' + msg + '</text></svg>';
    },
    listen: function (o) {
      var lv = (o && o.levels) || null;
      var bars = [3,6,9,5,8,4,7,3].map(function (h, i) {
        if (lv) { h = Math.max(1, Math.round(lv[i] * 14)); return '<rect x="' + (40 + i * 6) + '" y="' + (60 - h) + '" width="4" height="' + h + '"/>'; }
        return '<rect class="eq" style="--d:' + (i * 70) + 'ms" x="' + (40 + i * 6) + '" y="' + (58 - h) + '" width="4" height="' + h + '"/>';
      }).join('');
      return '<g transform="translate(32 0) scale(.5)">' + face('listen') + '</g>' +
        '<text x="64" y="42" ' + PX + ' font-size="6" text-anchor="middle">' + (lv ? 'LISTENING' : 'LISTENING...') + '</text>' +
        '<g fill="#fff">' + bars + '</g>';
    },
    think: function () {
      return '<g transform="translate(32 0) scale(.5)">' + face('think') + '</g>' +
        '<text x="64" y="50" ' + PX + ' font-size="6" text-anchor="middle">THINKING</text>' +
        '<g fill="#fff"><rect class="dot" style="--d:0ms" x="56" y="56" width="3" height="3"/><rect class="dot" style="--d:200ms" x="62" y="56" width="3" height="3"/><rect class="dot" style="--d:400ms" x="68" y="56" width="3" height="3"/></g>';
    },
    find: function () {
      return '<text x="64" y="28" ' + PX + ' font-size="6" text-anchor="middle">SEARCHING</text>' +
        '<text x="64" y="44" ' + T + ' font-size="13" text-anchor="middle">_deskbuddy._tcp</text>';
    },
    boot: function () {
      return '<text x="64" y="30" ' + PX + ' font-size="8" text-anchor="middle">DESKBUDDY</text>' +
        '<text x="64" y="46" ' + T + ' font-size="13" text-anchor="middle">v2.0.0-dev</text>';
    }
  };

  function screen(name, o) { return (SCREENS[name] || SCREENS.mochi)(o || {}); }

  window.Mochi = { face: face, screen: screen, MOODS: MOODS, has: function (m) { return !!F[m]; } };
})();

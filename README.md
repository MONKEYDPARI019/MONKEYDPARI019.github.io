# monkeydpari019.github.io

Source for **Bench Log** — a single-page site showing the hardware I build: DeskBuddy v2 with a browser simulator of the device and its app, plus six earlier projects with the README, full source, circuit diagram and parts list for each one.

Live at **[monkeydpari019.github.io](https://monkeydpari019.github.io)** → `optimus.html`

---

## Where this came from

While building [DeskBuddy](https://github.com/MONKEYDPARI019/DeskBuddy) I needed a way to set the WiFi credentials without reflashing the board every time, so I wrote a small HTML configuration page that the ESP8266 serves from its own access point — a handful of form fields, a Save button, written to LittleFS.

It was a means to an end. But it was also the first time a page I had written was doing something real.

A while later I was sitting around with nothing in particular to do, thought back to that little config portal, and figured: if a microcontroller with 80KB of RAM can serve a page, there is no reason my projects should only exist as folders of `.ino` files nobody opens. So I built one.

---

## What is on it

**DeskBuddy v2** up front — an ESP32 desk companion with an animated face (Mochi) and a native Android app — with a scroll-driven walkthrough of its screens, an architecture diagram, and a **browser simulator** of the device and the app side by side. Tap a mood in the app and Mochi changes on the device; press the device's buttons and the app follows. The messages in the log are the real ones from the firmware's [protocol](https://github.com/MONKEYDPARI019/DeskBuddy-v2/blob/main/docs/PROTOCOL.md); the link itself is simulated.

Then six earlier projects, ordered the way I actually learned them rather than the way they look best:

| # | Project | Tier |
|---|---|---|
| 01 | [nRF24L01 Link](https://github.com/MONKEYDPARI019/nRF24L01_transmitter_and_receiver) | Beginner |
| 02 | [ESP32 RC Car](https://github.com/MONKEYDPARI019/ESP32_RC_car) | Beginner+ |
| 03 | [MP3 Player](https://github.com/MONKEYDPARI019/MP3-Player) | Intermediate |
| 04 | [ESP8266 Surveying Node](https://github.com/MONKEYDPARI019/ESP8266_surveying) | Intermediate |
| 05 | [65W PD Power Bank](https://github.com/MONKEYDPARI019/65W-PD-powerbank) | Advanced |
| 06 | [DeskBuddy v1](https://github.com/MONKEYDPARI019/DeskBuddy) | Advanced |
| 07 | [DeskBuddy v2](https://github.com/MONKEYDPARI019/DeskBuddy-v2) | Featured |

Each project has four screens behind OLED-style toggle buttons:

- **README** — why it exists, and what went wrong
- **CODE** — the complete sketch, scrollable, with copy to clipboard
- **CIRCUIT** — a diagram drawn from the pin assignments in that sketch, not a stock image
- **PARTS** — what it takes to build one

The failures are written down next to the successes. The MP3 player worked and then died to a short circuit because I soldered a veroboard without planning component placement. The RC car has two `#define` lines swapped because left and right came out backwards and editing code was faster than unsoldering a motor. DeskBuddy has two decoupling capacitors that exist only because the board kept resetting under load.

---

## How it is built

Static files, no framework, no build step — GitHub Pages serves them straight off `main`.

```
optimus.html          the page
index.html            a redirect, so the bare domain resolves
favicon.svg           Mochi, 32×32
assets/css/style.css  design tokens, layout, sections
assets/css/sim.css    the simulator (phone + device)
assets/js/mochi.js    Mochi's faces and the 128×64 OLED screens
assets/js/sim.js      simulator state, app tabs, device buttons, sound
assets/js/main.js     theme, smooth scroll, reveals, pinned walkthrough, tabs, boot screen
assets/vendor/        GSAP + ScrollTrigger, Lenis (self-hosted copies)
assets/fonts/         Press Start 2P, VT323, IBM Plex Mono (self-hosted)
```

- **The look** is the same design language as the DeskBuddy Android app: warm paper and black ink, one burnt-orange accent, square corners, hard pixel shadows, light and dark themes.
- **Motion:** Lenis for smooth scrolling, GSAP ScrollTrigger for reveals and the pinned DeskBuddy section. A short "DESKBUDDY OS" boot screen plays once per visit (click to skip).
- **Circuit diagrams** are hand-written inline SVG that stroke-draws itself when its panel opens.
- No third-party requests at all: fonts and libraries are served from this repo.
- Respects `prefers-reduced-motion`, and everything still works if the scripts fail to load.

## How this was built

The hardware, the firmware and the debugging in every project here are mine. The web page is not my usual territory — I directed the design, chose the palette, picked what went on it and checked the technical content, but the HTML, CSS and JavaScript were written with Claude. I had a Pro subscription I wanted to learn properly, and this seemed a more useful way to learn it than a tutorial.

Saying so here because I would rather you know than find out.

---

## Licence

The site code is free to borrow. The projects it describes are linked above and carry their own licences.

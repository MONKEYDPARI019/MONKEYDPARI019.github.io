# monkeydpari019.github.io

Source for **Bench Log** — a single-page site showing six hardware projects I built, with the README, full source, circuit diagram and parts list for each one.

Live at **[monkeydpari019.github.io](https://monkeydpari019.github.io)** → `optimus.html`

---

## Where this came from

While building [DeskBuddy](https://github.com/MONKEYDPARI019/DeskBuddy) I needed a way to set the WiFi credentials without reflashing the board every time, so I wrote a small HTML configuration page that the ESP8266 serves from its own access point — a handful of form fields, a Save button, written to LittleFS.

It was a means to an end. But it was also the first time a page I had written was doing something real.

A while later I was sitting around with nothing in particular to do, thought back to that little config portal, and figured: if a microcontroller with 80KB of RAM can serve a page, there is no reason my projects should only exist as folders of `.ino` files nobody opens. So I built one.

---

## What is on it

Six projects, ordered the way I actually learned them rather than the way they look best:

| # | Project | Tier |
|---|---|---|
| 01 | [nRF24L01 Link](https://github.com/MONKEYDPARI019/nRF24L01_transmitter_and_receiver) | Beginner |
| 02 | [ESP32 RC Car](https://github.com/MONKEYDPARI019/ESP32_RC_car) | Beginner+ |
| 03 | [MP3 Player](https://github.com/MONKEYDPARI019/MP3-Player) | Intermediate |
| 04 | [ESP8266 Surveying Node](https://github.com/MONKEYDPARI019/ESP8266_surveying) | Intermediate |
| 05 | [65W PD Power Bank](https://github.com/MONKEYDPARI019/65W-PD-powerbank) | Advanced |
| 06 | [DeskBuddy](https://github.com/MONKEYDPARI019/DeskBuddy) | Advanced |

Each project has four screens behind OLED-style toggle buttons:

- **README** — why it exists, and what went wrong
- **CODE** — the complete sketch, scrollable, with copy to clipboard
- **CIRCUIT** — a diagram drawn from the pin assignments in that sketch, not a stock image
- **PARTS** — what it takes to build one

The failures are written down next to the successes. The MP3 player worked and then died to a short circuit because I soldered a veroboard without planning component placement. The RC car has two `#define` lines swapped because left and right came out backwards and editing code was faster than unsoldering a motor. DeskBuddy has two decoupling capacitors that exist only because the board kept resetting under load.

---

## How it is built

One file. No framework, no build step, no dependencies.

```
optimus.html    the entire site — HTML, CSS, JS, and six inline SVG circuit diagrams
index.html      a redirect, so the bare domain resolves
```

- **Circuit diagrams** are hand-written inline SVG that stroke-draws itself when its panel opens.
- **The palette** is three colours: `#22252A` surface, `#8FC2D8` accent, `#CFCAC1` warm light.
- **The OLED buttons** are CSS — a dark inset screen, scanlines, a moving blue sheen, and an `ON`/`OFF` readout driven by `aria-pressed`.
- **The robot** in the header tracks your cursor.
- Only external dependency is Google Fonts. Everything else is inline.
- Respects `prefers-reduced-motion`.

Hosted on GitHub Pages, straight off `main`.

## How this was built

The hardware, the firmware and the debugging in every project here are mine. The web page is not my usual territory — I directed the design, chose the palette, picked what went on it and checked the technical content, but the HTML, CSS and JavaScript were written with Claude. I had a Pro subscription I wanted to learn properly, and this seemed a more useful way to learn it than a tutorial.

Saying so here because I would rather you know than find out.

---

## Licence

The site code is free to borrow. The projects it describes are linked above and carry their own licences.

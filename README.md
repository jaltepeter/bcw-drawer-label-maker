# BCW Drawer Label Maker

Web app to create drawer front labels for a trading card catalog. Labels are **MTG card size** (2.5″ × 3.5″) at **300 DPI** so you can print them and use **Print then Cut** in Cricut Design Studio (or print on cardstock and trim).

- Pick an icon from **mana/ability symbols** via **[Mana](https://github.com/andrewgioia/mana)** (curated list; SVGs from jsDelivr CDN).
- Label text uses **Beleren2016 Small Caps Bold** (local font in `public/fonts/`).
- Live preview and one-click **Download PNG**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. http://localhost:5173). Use **Download PNG** to save a 750×1050 px image for Cricut/printing.

## Tests

```bash
npm run test        # watch mode
npm run test:run    # single run
```

Unit tests cover constants (card dimensions, DPI), the icon set, layout math (icon zone, text area, scaling), and card rendering/download (with mocked canvas).

## Stack

- **Vite** + **TypeScript** (vanilla, no framework)
- **Vitest** for unit tests
- Canvas API for layout and PNG export
- No backend; everything runs in the browser

## Fonts

Label text uses **Beleren2016 Small Caps Bold** from `public/fonts/Beleren2016SmallCaps-Bold.ttf`. **TTF** is supported in all modern browsers. For smaller file size and slightly better performance, you can add **WOFF2** (e.g. convert with [CloudConvert](https://cloudconvert.com/ttf-to-woff2) or [fonttools](https://github.com/fonttools/fonttools)) and add a second `src` in `src/fonts.css`:

```css
src: url('/fonts/Beleren2016SmallCaps-Bold.woff2') format('woff2'),
     url('/fonts/Beleren2016SmallCaps-Bold.ttf') format('truetype');
```

## Credits

- **Label font:** Beleren2016 Small Caps Bold (local).
- **[Mana](https://github.com/andrewgioia/mana)** by Andrew Gioia — SVG mana symbols (W, U, B, R, G, colorless, color pie) loaded via [jsDelivr](https://www.jsdelivr.com/) CDN.

# BCW Drawer Label Maker

Web app to create drawer front labels for a trading card catalog. Labels are **MTG card size** (2.5″ × 3.5″) at **300 DPI** so you can print them and use **Print then Cut** in Cricut Design Studio (or print on cardstock and trim).

- Pick an icon from **mana/ability symbols** via **[Mana](https://github.com/andrewgioia/mana)** (curated list; SVGs from jsDelivr CDN).
- Label text uses **Mplantin** from [mtg-font](https://github.com/AlexandreArpin/mtg-font) (MIT).
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

## Credits

This app uses the following third-party resources:

- **[mtg-font](https://github.com/AlexandreArpin/mtg-font)** by Alexandre Arpin — Mplantin font for label text. [MIT License](https://github.com/AlexandreArpin/mtg-font/blob/master/LICENSE).
- **[Mana](https://github.com/andrewgioia/mana)** by Andrew Gioia — SVG mana symbols (W, U, B, R, G, colorless, color pie) loaded via [jsDelivr](https://www.jsdelivr.com/) CDN.

Both are loaded from CDN at runtime; no assets are bundled. The app footer also displays these credits.

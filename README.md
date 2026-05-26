# The Rainbow Personality Test

An English-only web application for completing the 40-statement Rainbow
Personality Test and exploring the resulting team-role profile visually.

## Features

- Eight-page questionnaire with saved in-browser progress
- Four-dimension scoring (`A`, `B`, `C`, `D`)
- Dominant colour and tied-profile detection
- SVG quadrant map based on the original triangle-area concept
- Colour comparison bars and interpretation cards
- Responsive layout for desktop and mobile screens

## Scoring

Each statement is rated from `1` (hardly ever/never true) to `5` (almost
always true). Statements are assigned to dimensions in repeating order:

| Dimension | Statement numbers |
| --- | --- |
| A | 1, 5, 9, 13, 17, 21, 25, 29, 33, 37 |
| B | 2, 6, 10, 14, 18, 22, 26, 30, 34, 38 |
| C | 3, 7, 11, 15, 19, 23, 27, 31, 35, 39 |
| D | 4, 8, 12, 16, 20, 24, 28, 32, 36, 40 |

Colour areas are calculated as:

```text
RED    = (D * A) / 2
YELLOW = (A * B) / 2
BLUE   = (B * C) / 2
GREEN  = (C * D) / 2
```

Each raw dimension ranges from `10` to `50`. Each calculated colour area
ranges from `50` to `1250`.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

The app is static and stores unfinished responses only in the browser's local
storage.

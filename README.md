# melbl8-clock01 Shield, PT Serif and Open Sans

A separate 3840 × 804 build of the meditative particle clock for NVIDIA Shield and Enplug signage playback.

## Font replacement

| Original role | Replacement | Local file |
|---|---|---|
| MetaPro Bold, particle digits | Open Sans Bold | `assets/fonts/OpenSans-Bold.ttf` |
| MetaSerif Black, footer clock | PT Serif Bold | `assets/fonts/PTSerif-Bold.ttf` |
| MetaPro Medium, vertical metadata | Open Sans Semibold | `assets/fonts/OpenSans-Semibold.ttf` |

The production clock does not request fonts from Google Fonts at runtime. Official font binaries and SIL Open Font License notices are committed under `assets/fonts/`.

## Shield profile

- Native canvas: 3840 × 804
- Pixel density: 1
- Frame-rate cap: 30 fps
- 900 particles per zone, 3,600 total
- Cached digit masks, with no per-frame offscreen canvas generation
- CSS-only viewport scaling for mobile testing
- Slow, non-blocking location retry

Open Sans is slightly broader than the original MetaPro digit font. The digit mask is set to 372 px rather than 375 px so every numeral stays inside the existing 900-particle budget without raising Shield load.

## Production

https://creative-innovation-labs-bmc.github.io/melbl8-clock01-shield-PT-Serif-Open-Sans/

The page uses `noindex`, `nofollow`, `noarchive`, `nosnippet`, and `robots.txt`. It is undiscoverable to normal search indexing, but GitHub Pages remains a public URL rather than an access-controlled site.

Build cache version: `20260805a`.

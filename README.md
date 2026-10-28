# aicut-examples

Example films for [AICUT](https://github.com/autoaiai/aicut) — a film is a web page that draws any moment `t`.

Open one in Studio:

```sh
npx -y @autoaiai/aicut@latest open https://github.com/autoaiai/aicut-examples/tree/main/pixel-odyssey
npx -y @autoaiai/aicut@latest open https://github.com/autoaiai/aicut-examples/tree/main/sky-story
npx -y @autoaiai/aicut@latest open https://github.com/autoaiai/aicut-examples/tree/main/shadow-moon
```

| example | what it is | runtime |
| --- | --- | --- |
| [`pixel-odyssey`](pixel-odyssey) | a pixel-art platformer title sequence, five scenes | ~30 s |
| [`sky-story`](sky-story) | why the sky is blue — Rayleigh scattering, six scenes | 30 s |
| [`shadow-moon`](shadow-moon) | a shadow-puppet theatre, the phases of the moon | 20 s |

Each folder is self-contained: `film.html` is the cut, everything else is what it pulls in. Point Studio at the folder and it plays.

## pixel-odyssey

A pixel-art platformer title sequence — five scenes cut together in `film.html`.

- `film.html` — the cut: five pages on one track, a music bed and sound effects as clips
- `scenes/` — one page per scene, drawn with `lib/pixel.js`
- `assets/` — the font, the music bed and the sound effects
- `tools/make_audio.mjs` — how the sounds were made

## sky-story

Six 5.5-second scenes and one music bed, 30 seconds end to end: white light, molecules, wavelength, the sky, sunset, title.

- `film.html` — six iframes back to back on one track, the bed as a single audio clip
- `01-white.html` … `06-title.html` — one file per beat, all sharing `_flat.css` and `_flat.js`
- `assets/bed.wav` — the bed; `_audio.sh` shows how it was synthesised

## shadow-moon

A Chinese shadow-puppet theatre — one translucent cloth, one lamp, a few punched puppets — and the moon going through its phases in 20 seconds.

- `film.html` — one 20-second page plus `assets/stage.wav`
- `01-stage.html` — the whole scene drawn on a canvas: lamp, shadow layer, light layer, cloth grain, vignette
- `_shadow.css` — the stage sizing
- `shadow-moon.web.mp4` — the rendered cut, web encode for previewing without Studio

## What stays local

`node_modules/`, `.film/` and the ffmpeg under `tools/bin/` are local only and not part of the examples. Master renders (`*.mp4` other than the `*.web.mp4` previews) are also kept out — they run past GitHub's 100 MB per-file limit and can be regenerated with AICUT.

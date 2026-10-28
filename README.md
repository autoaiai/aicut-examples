# pixel-odyssey

An AICUT example film: a pixel-art platformer title sequence — five scenes cut together in `film.html`.

Open it in Studio:

```sh
npx -y @autoaiai/aicut@latest open https://github.com/autoaiai/aicut-examples
```

- `film.html` — the cut: five pages on one track, a music bed and sound effects as clips
- `scenes/` — one page per scene, drawn with `lib/pixel.js`
- `assets/` — the font, the music bed and the sound effects
- `tools/make_audio.mjs` — how the sounds were made

`node_modules/`, `.film/` and the ffmpeg under `tools/bin/` are local only and not part of the example.

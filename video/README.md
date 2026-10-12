# EU JUST Europe map video

Independent Remotion authoring project. The website serves the pre-rendered files in `../public/videos`; it does not load Remotion or MapLibre in visitors’ browsers.

## Preview and render

Run from this directory:

```sh
npm ci
npm run dev
npm run lint
npm run render:landscape
npm run render:portrait
```

Studio offers `EuropeLandscape` (1920×1080) and `EuropePortrait` (1080×1920). Both are silent 12-second loops at 30 fps, encoded as H.264. Portrait has its own camera framing rather than cropping the landscape composition. The website chooses portrait at widths up to 700px, and uses static posters for reduced motion or data saving until the visitor presses Play.

Render scripts use `/usr/bin/chromium` and software ANGLE (`--gl=swangle`) for the managed cloud environment. On another machine, change `--browser-executable` to the local Chromium installation or omit it to use Remotion’s managed browser. In this cloud environment, set `npm_config_cache=/workspace/.npm` if the default npm cache is not writable. Render posters using `npx remotion still EuropeLandscape ../public/videos/europe-landscape-poster.png --frame=0 --browser-executable=/usr/bin/chromium --gl=swangle`, and repeat for `EuropePortrait` and its corresponding filename.

## Map and animation

A fixed MapLibre camera uses local GeoJSON, native country fills and borders. `useCurrentFrame()` controls a seamless, phased change in EU-country fill opacity. Map transitions and fade durations are zero; rendering waits for map load and each frame. No live activity, legal coverage or data flow is represented by the animation.

`public/countries.geojson` derives from Natural Earth’s simplified 1:110m Admin 0 Countries dataset, downloaded on 12 October 2026:

- Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
- Original SHA-256: `6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f`
- Public-domain terms: https://www.naturalearthdata.com/about/terms-of-use/

Geometry is retained; properties are reduced to country name, ADM0 code, an EU membership flag and animation phase. The simplified source omits some small territories. Membership colouring is decorative and does not describe the site’s record coverage.

`public/maplibre-worker.js` is copied from the installed MapLibre GL JS CSP worker. Its accompanying license is `public/MapLibre-LICENSE.txt`. Keep the worker aligned with the lockfile when upgrading MapLibre. Remotion licensing: https://www.remotion.dev/license

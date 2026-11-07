# Third-party notices

Source code adapted into this repository retains its original license notice here.

## tunnel-rat

`lib/webgl/utils/tunnel.ts` is a TypeScript port of the `tunnel()` factory from
[tunnel-rat](https://github.com/pmndrs/tunnel-rat).

```
MIT License

Copyright (c) 2022 Poimandres

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Social media logos

`public/social/*.png` are the networks' own logos, downloaded from their brand
pages on 7 November 2026 and resized to 256px; nothing else is changed. They
link to HONEST's profiles (or the network's home page until the CMS has one)
from the phone's home screen and the desktop dock (`SocialMark` in
`components/ui/window/dock-icons.tsx`). Each network's rules forbid redrawing,
recolouring, outlines and shadows, so they are drawn as supplied, outside the
HONEST icon tiles.

| File            | Source                                                                   | Owner                |
| --------------- | ------------------------------------------------------------------------ | -------------------- |
| `instagram.png` | Instagram glyph (gradient), meta.com/brand/resources/instagram           | Meta                 |
| `x.png`         | X logo (white), about.x.com/en/who-we-are/brand-toolkit                  | X Corp.              |
| `youtube.png`   | YouTube icon (red, digital), brand.youtube/youtube-icon                  | Google LLC           |
| `tiktok.png`    | TikTok icon (black square), developers.tiktok.com design guidelines pack | TikTok               |
| `linkedin.png`  | LinkedIn "in" bug (blue), brand.linkedin.com/downloads                   | LinkedIn Corporation |

Instagram is a trademark of Meta. X is a trademark of X Corp. YouTube is a
trademark of Google LLC. TikTok and the TikTok logo are trademarks of TikTok.
LinkedIn is a registered trademark of LinkedIn Corporation. HONEST Marketing is
not affiliated with or endorsed by these companies.

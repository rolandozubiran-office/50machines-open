# Third-party notices

Third-party notices. 50machines.com and the 50machines-open repository include code from the "anatomy" drawing kit by Ryan (github.com/wheresryan22/anatomy, commit 4a32cf2), used under the MIT License reproduced below. This code is not owned by ASSEMBLR VENTURES, S.L.; the ASSEMBLR copyright and licenses on this site and repository do not apply to it.

Avisos de terceros. 50machines.com y el repositorio 50machines-open incluyen código del kit de dibujo «anatomy» de Ryan (github.com/wheresryan22/anatomy, commit 4a32cf2), usado con la licencia MIT que se reproduce abajo. Este código no es titularidad de ASSEMBLR VENTURES, S.L., y el copyright y las licencias de ASSEMBLR de este sitio y repositorio no se le aplican.

Code in this repository that belongs to someone else keeps the licence its author gave it. The copyright in `LICENSE` (Copyright (c) 2026 ASSEMBLR VENTURES, S.L.) does not cover that code.

## anatomy drawing kit

The isometric drawing kit **anatomy** is third-party software.

- Author: Ryan
- Copyright: Copyright (c) 2026 Ryan
- Licence: MIT License
- Repository: https://github.com/wheresryan22/anatomy
- Reference commit: [`4a32cf2fbbda782f0c976fabba1fa1e50c9ae91f`](https://github.com/wheresryan22/anatomy/commit/4a32cf2fbbda782f0c976fabba1fa1e50c9ae91f) ("Anatomy skill (v1)", 2026-10-08). On that public repository, `LICENSE`, `kit/iso-kit.mjs`, `kit/iso.css`, `kit/lathe.mjs`, `kit/tube.mjs` and `scripts/inline-kit.mjs` have no later commit. The notice below is the exact text of `LICENSE` at that commit: https://github.com/wheresryan22/anatomy/blob/4a32cf2fbbda782f0c976fabba1fa1e50c9ae91f/LICENSE

### Files in this repository that contain or use the kit

- `reference/power/power.html` — contains the kit's code and CSS, inserted into the page.
- `reference/kiln/build.mjs` — imports the kit (`kit/iso-kit.mjs`, `kit/lathe.mjs`, `kit/tube.mjs`, `scripts/inline-kit.mjs`) when it renders the kiln guide.
- `reference/power/build.mjs` — imports the kit the same way when it renders the power guide.

### MIT License

The following is the exact text of Ryan's `LICENSE`:

```
MIT License

Copyright (c) 2026 Ryan

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

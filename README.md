# 50 Machines · open technology tree

[English](README.md) · [Español](README.es.md)

[50machines.com](https://50machines.com) is a field manual of 50 machines in the order you could build them, from a clay kiln to a relay computer. Each machine uses only what the machines before it make.

The first 50 guides were made by Rolando Zubirán. This repository holds the format, the templates and two reference guides so that anyone can propose machine 51 and beyond. Accepted machines appear in the tree on the site, marked **community**.

## What is here

| Folder | What it holds |
|---|---|
| `GUIDE_FORMAT.md` | The guide format: files, fields, conventions, truth and safety rules. |
| `template/` | Empty skeleton for a new machine: `meta.json`, `model.mjs`, `guide.mjs`. |
| `prompts/PROMPT_KIT.md` | Prompts to draft a guide with your own AI (Claude or another) in the exact format. |
| `reference/kiln`, `reference/power` | Two complete published guides (machine 1 and machine 23) to copy. |
| `runtime/` | The shared guide player (`guide.js`, `guide.css`). |
| `data/machines.mjs` | The 50 machines, their parts of the tree and what each one needs. |
| `data/hub.es.json` | The same 50 machines in Spanish: names, lines and key numbers. |
| `scripts/generate.mjs` | Builds a downloadable model card and guide for every machine. |
| `download/` | Those cards, after you run the generator. One folder per machine, plus a zip. |
| `community/` | Where new machines are submitted, one folder each. |

## How to contribute a machine

1. Open an issue with the **Propose a machine** template. Say what it does, what earlier machines it needs and your sources.
2. Copy `template/` to `community/<slug>/` and fill it in. You may draft with your own AI using `prompts/PROMPT_KIT.md`. You are responsible for every number and every step.
3. Open a pull request. Fill in the checklist.
4. A maintainer reviews it against `CONTRIBUTING.md` and `SAFETY.md`. Nothing is published on the site without review. Maintainers render the isometric drawing with Ryan's anatomy kit if you cannot (MIT; see `THIRD_PARTY_NOTICES.md`).
5. When it is accepted it appears on 50machines.com marked **community**, with your name.

## Download the 50 model cards

`data/machines.mjs` is the open catalog of all 50 machines. Spanish names and lines are in `data/hub.es.json`. Machine 1 and machine 23 also have full reference guides in `reference/kiln` and `reference/power`.

From a clean clone, with Node.js 18 or newer and nothing to install:

```
node scripts/generate.mjs
```

`npm run generate` is the same command. It writes one folder per machine under `download/machines/`, plus `download/index.html` and `download/50-machines.zip`.

Each folder has `meta.json`, `model.mjs`, `guide.en.md`, `guide.es.md` and `guide.html`. Machines 1 and 23 also include the reference guide and its physics model. The other cards carry the published place in the tree, the key number and the design brief already in the catalog. They are not step-by-step shop guides, and they do not add numbers that are not already in the catalog. Read `SAFETY.md` before you build anything.

## Licence

Content in this repository is under Creative Commons Attribution-ShareAlike 4.0. Code in this repository is under the MIT License.

- **Code** (`runtime/`, `reference/**/*.mjs|js`, scripts): MIT, see `LICENSE`.
- **Content** (guide text, data, numbers, drawings, everything else): Creative Commons Attribution-ShareAlike 4.0, see `LICENSE-CONTENT`. Credit: "50 Machines (50machines.com)".

Those licences cover only this repository. They do not cover the printed edition of the book *50 Machines* (© 2026 ASSEMBLR VENTURES, S.L., all rights reserved for that edition). They also do not cover the 50machines.com brand.

Rights holder of this repository's own material: ASSEMBLR VENTURES, S.L. (Madrid, Spain).

Third-party code keeps its own licence. The isometric drawings are rendered with Ryan's open-source anatomy kit (https://github.com/wheresryan22/anatomy), which remains under the MIT License, Copyright (c) 2026 Ryan. See `THIRD_PARTY_NOTICES.md`. The copyright in `LICENSE` does not cover that kit.

The anatomy drawing kit and any code from it (including inlined copies in reference/**/*.html) are © 2026 Ryan, MIT License; see THIRD_PARTY_NOTICES.md.

**By submitting a pull request you certify that you wrote the contribution or have the right to submit it, and you agree that it is licensed under CC BY-SA 4.0 (content) and MIT (code).** Add `Signed-off-by: Your Name <email>` to your commits (`git commit -s`), as in the Developer Certificate of Origin (https://developercertificate.org).

## Safety

These are build guides for real machines. Some involve fire, pressure, molten metal, toxic gases or high current. Read `SAFETY.md`. Build at your own risk and follow local law.

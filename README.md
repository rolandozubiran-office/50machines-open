# 50 Machines · open technology tree

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
| `community/` | Where new machines are submitted, one folder each. |

## How to contribute a machine

1. Open an issue with the **Propose a machine** template. Say what it does, what earlier machines it needs and your sources.
2. Copy `template/` to `community/<slug>/` and fill it in. You may draft with your own AI using `prompts/PROMPT_KIT.md`. You are responsible for every number and every step.
3. Open a pull request. Fill in the checklist.
4. A maintainer reviews it against `CONTRIBUTING.md` and `SAFETY.md`. Nothing is published on the site without review. Maintainers render the isometric drawing with the project's drawing kit if you cannot.
5. When it is accepted it appears on 50machines.com marked **community**, with your name.

## Licence

- **Code** (`runtime/`, `reference/**/*.mjs|js`, scripts): MIT, see `LICENSE`.
- **Content** (guide text, data, numbers, drawings, everything else): Creative Commons Attribution-ShareAlike 4.0, see `LICENSE-CONTENT`. Credit: "50 Machines (50machines.com)".
- Rights holder: ASSEMBLR VENTURES, S.L. (Madrid, Spain).
- **By submitting a pull request you certify that you wrote the contribution or have the right to submit it, and you agree that it is licensed under CC BY-SA 4.0 (content) and MIT (code).** Add `Signed-off-by: Your Name <email>` to your commits (`git commit -s`), as in the Developer Certificate of Origin (https://developercertificate.org).

The printed book and the 50machines.com brand are not covered by these licences.

## Safety

These are build guides for real machines. Some involve fire, pressure, molten metal, toxic gases or high current. Read `SAFETY.md`. Build at your own risk and follow local law.

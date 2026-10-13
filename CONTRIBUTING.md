# Contributing

## The one rule
A machine may only need machines that come before it in the tree. List them by number in `meta.json` → `needs`.

## Submission checklist (copy into your pull request)
- [ ] One machine per pull request, in `community/<slug>/`.
- [ ] `meta.json` complete and valid against `community/machine.schema.json`.
- [ ] `needs` lists only existing machines (1–50 or accepted community machines).
- [ ] Part A has 5–9 build steps; Part B has 2–4 run steps. Each step has `need`, `steps` and a `check` you could actually perform.
- [ ] Metric units. Real materials. Sizes match the model.
- [ ] Every number has a source in `sources` or a formula stated in the caption. No invented statistics.
- [ ] Hazards named and a safety line written (see `SAFETY.md`).
- [ ] If drafted with AI: I have checked every number, step and source myself. (Say which tool you used.)
- [ ] I agree to license this under CC BY-SA 4.0 (content) and MIT (code).

## Review
1. **Format check** (automatic and by eye): files, fields, step counts.
2. **Truth check**: a maintainer checks sources and numbers. Unsourced claims are removed or the PR waits.
3. **Safety check**: hazardous builds get a second reviewer. Weapons, explosives, pathogens, toxic-gas production beyond small water-treatment quantities, and anything illegal to operate are refused.
4. **Render**: maintainers build the isometric guide and the thumbnail.
5. **Publish**: merged machines appear on 50machines.com marked **community**, credited to you.

Nothing is published without review. Reviews are best effort; a maintainer will answer every pull request. Maintainers may edit for format and clarity.

## Conduct
Be precise and kind. Disagree with sources, not people.

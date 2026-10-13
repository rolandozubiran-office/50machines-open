# Prompt kit: draft a guide with your own AI

Works with Claude, ChatGPT, Gemini or any capable model. Paste the files it asks for. **You must check every number, step and source yourself.** The AI drafts; you are the author.

## Prompt 1 · Place the machine in the tree
```
You are helping me propose a new machine for 50 Machines, an open technology tree of machines in the order they can be built.
Here is the list of existing machines with what each needs: <paste data/machines.mjs>
My machine: <name and one line on what it does>.
1. Which existing machines does it need (by number)? A machine may only need machines that exist already.
2. Which of the five parts (I Fire and water, II Metal and motion, III Electricity, IV Living well, V Signals and computing) does it belong to?
3. List 3–6 reliable published sources (books, technical briefs, papers) I should read. Do not invent sources; if unsure, say so.
```

## Prompt 2 · Write guide.mjs and meta.json
```
Write the guide for <machine> in exactly the format of this reference: <paste GUIDE_FORMAT.md and reference/kiln/guide.mjs and reference/kiln/meta.json>.
Rules: plain language, short sentences, metric units, real materials and sizes. Part A 5–9 build steps, Part B 2–4 run steps. Each step has lead, need, 2–3 steps, one check I can actually perform, and a short readout with a real number.
Use only numbers from these sources: <paste notes or quotes>. If a number is not in the sources, write TODO instead of guessing.
Name every hazard and write one plain safety line.
Output two code blocks: guide.mjs and meta.json (schema: <paste community/machine.schema.json>).
```

## Prompt 3 · Write model.mjs
```
Write model.mjs for <machine>: small pure JavaScript functions (no DOM, no randomness) that compute the key numbers in the guide from parameters, in the style of <paste reference/power/model.mjs>. State every assumption in a comment and give the formula.
```

## Prompt 4 · Self-review before the pull request
```
Review this guide as a strict technical editor: <paste guide.mjs, meta.json, model.mjs>.
List: (1) every number and whether a listed source supports it, (2) any step without a performable check, (3) any hazard not named, (4) any need that is not an earlier machine, (5) format errors against GUIDE_FORMAT.md. Do not rewrite; list problems.
```

Then fix the problems yourself, tick the checklist in `CONTRIBUTING.md` and open the pull request.

# How to write a new spec (template)

Copy this file to `specs/006-your-name/spec.md` and fill it. Keep it to 1 page.

## 1. Title

`<Verb> <thing> for <who>`

## 2. Problem (2 lines)

What pain? For whom? What happens today without this?

## 3. Non-goals

What we explicitly will NOT do in this spec.

## 4. Functional requirements

- FR-1: ...
- FR-2: ...
- FR-3: ...

Keep each FR testable: `Given <input>, When <action>, Then <observable output>`.

## 5. Contracts

List files the verifier will check, e.g.:

- `contracts/output.schema.json` (JSON schema)
- `contracts/repos.yaml` (registry)

## 6. Open questions

- [ ] Q1: ... (owner, due date)

## 7. Tasks pointer

Detailed checkboxes live in `tasks.md` next to this file. This `spec.md` never contains checkboxes.

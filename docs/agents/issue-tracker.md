# Issue tracker

Issues, specs and grilling answers for this repo live as **local markdown** under
`.scratch/breadbasket-v01/issues/`, numbered sequentially: `NN-slug.md`.

Skills that read or write issues (`to-spec`, `to-tickets`, `triage`, `qa`) should
create and update files there rather than calling `gh`. The repo has a GitHub
remote, but its Issues tab is not in use.

Each file carries a short header block:

```
Type: spec | grilling | bug
Status: <triage label>
Audience: us | founder
Blocked by: —
```

## Triage labels

The five canonical roles, label strings equal to their names:
`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`.

## Domain docs

Single context. `CONTEXT.md` and `docs/adr/` at the repo root. Read `CONTEXT.md`
for vocabulary before writing a spec; respect the ADRs in the area you touch.

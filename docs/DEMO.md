# 90-second demo script

**0–12s — Problem**  
“Test-impact tools tell us which tests to run after a code change. But what evidence do we have that the prediction is complete?”

**12–28s — Prediction**  
Open the Terrarium sample and click Run experiment. Show the dependency-derived test surface for `src/pricing.py`.

**28–52s — Controlled challenge**  
Show the mutation ledger. Each mutant is applied to a fresh temporary copy; the original source is not changed. Terrarium runs the full suite and records the actual failures.

**52–72s — Miss evidence**  
Show the reflection-based test in the missed-test evidence. The test reaches the function through `getattr`, which the simple static name-call resolver does not infer. The mutation experiment reveals the omission.

**72–90s — Trust report**  
Show mutation-tested recall and valid-mutant count. Say: “This score is evidence for this experiment, not a guarantee for every future change. Terrarium doesn't ask you to blindly trust its predictions. It tests them against reality.”

## Fallback

If the live experiment exceeds the demo window, keep a precomputed JSON report from `make demo` and show the dashboard with the recorded result. Be explicit that the JSON is a prepared sample run; do not imply it was run live.

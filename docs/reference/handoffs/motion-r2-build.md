# Handoff: motion R2 matrix presence build (#186/#187)

_Written by the LEAD from the diff and the agent transcript: the Opus engineer finished the implementation and was killed at ~181K tokens mid browser validation, under the old 180K wrap line (Brian raised the Opus limit to 500K minutes later; the kill cost nothing material since a fresh Sonnet validator reruns the whole browser round). No agent-written handoff exists; this is the reconstruction._

## What landed (2 files, ~131 insertions)

1. src/scripts/scene/index.ts (+118): the surge engine. All five approved R2 knobs, verbatim from the spec:
   - NAV_SURGE_ATTACK_MS 160 / NAV_SURGE_PEAK_MS 90 / NAV_SURGE_RELEASE_MS 720, NAV_SURGE_DENSITY +0.18 additive on the field, fired on every internal navigation.
   - SURGE_DRIFT_MULT 1.25: the drift clock runs 25% faster at the crest (`t += dt * (1 + (SURGE_DRIFT_MULT - 1) * surgeS)`), easing back with the surge envelope. Drop to 1.0 if it reads jittery.
   - Live-layer wake: `armSurge(0, WAKE_HOLD_MS, WAKE_SETTLE_MS, WAKE_DENSITY)` at the first live frame, no attack (the canvas fade is the attack), WAKE_HOLD_MS 200, WAKE_SETTLE_MS 1500, WAKE_DENSITY +0.22.
   - MOBILE_INTENSITY 0.34 (single level), applied as `Math.min(placement.intensity, MOBILE_INTENSITY)`, density only, canvas opacity lands near 0.79.
   - armSurge no-ops while `!running` (backgrounded tab), so a hidden load wakes calm. Verified correct by the agent before it died.
2. src/scripts/terminal.ts (+13): the bridge fires the nav surge from syncSceneState on astro:page-load, so surge and identity travel share one trigger.

## Verified before the kill

- Lead spot-check: all five knob values present exactly as approved; dash check clean.
- Agent's contrast composite: night dim text over the busier ambient measures 5.10:1, above the 4.81:1 floor B1 reported. Measured inline (no standalone harness), grounds #0e1512/#fbfbf8, pour at 0.78/0.80.
- Agent's partial browser round: BR mark forms correctly, default identity intact, background-tab wake correctly suppressed.

## Outstanding at handoff time

- Full browser round (surge, wake, mobile ambient, perf gate `window.__scene.stats().max < 4ms`): delegated to a fresh Sonnet validator, report in COMMS.
- Facade untouched by design (LCP neutral, the boot-kill history stands).

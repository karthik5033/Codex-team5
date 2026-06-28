# PRD — *COLD BLOOD*
### One Button. Street Confrontation. No Escape.
**Buildathon Project | Desktop | Version 1.0**

---

## 1. Overview

**COLD BLOOD** is a single-player desktop game built around one mechanic: a single button. The player navigates three escalating street confrontation scenarios. Each scenario demands a real-time read of the situation — back down or fight. The *tap vs. hold* of that one button is the only control the player ever has.

If the player chooses to fight, they enter a one-button rhythm minigame to resolve the brawl. If they back down, timing alone determines how gracefully — or disastrously — that plays out.

Three scenes. One button. No second chances per scene.

---

## 2. Core Design Philosophy

- **One button, two dimensions:** *When* you press, and *how long* you hold. That's all.
- **Social tension is the obstacle.** Not platforms, not enemies — a human situation you have to read.
- **GD rhythm DNA lives only inside the fight.** The outer game is original. The inner game borrows rhythm mechanics but recontextualizes them as a brawl.
- **No tutorials.** The player figures it out by dying once.

---

## 3. The One Button — Full Specification

| Input | Definition | Effect |
|---|---|---|
| **Tap** (< 300ms) | De-escalate / Back down | Triggers negotiation outcome — timing determines win/partial/fail |
| **Hold** (≥ 300ms) | Escalate / Fight | Enters fight minigame |
| **No input** (timeout) | Freeze — you hesitated | Scene-specific penalty, usually worst outcome |

The button is: **Spacebar** (primary), **Left Mouse Click** (secondary).

---

## 4. Game Loop

```
SCENE LOADS
    → Confrontation animates, tension builds visually + aurally
    → Player has a TIME WINDOW to decide

          ┌─────────────────────────────────────────┐
          │                                         │
        TAP                                       HOLD
    (de-escalate)                              (fight)
          │                                         │
   Timing window                          Fight minigame
   determines outcome                     (GD-style rhythm)
   [Win / Partial / Fail]                  [Win / Lose]
          │                                         │
          └──────────────┬──────────────────────────┘
                         │
                  Scene outcome plays
                         │
                  Next scene OR Game Over
```

**Win condition:** Clear all 3 scenes (any combination of tap/hold paths).
**Game Over:** Fail a scene → restart from Scene 1. No checkpoints. (Buildathon scope — no save system.)

---

## 5. The Three Scenes

### Scene 1 — *The Corner*
**Setup:** Night. A narrow street corner. A stranger steps out and blocks the path. Low stakes — he's testing you, not threatening you yet. Tension is moderate and rising slowly.

**Decision window:** 6 seconds

**Tap outcomes:**
- Early tap (0–2s): You flinch. He smirks, lets you pass. You lose face but survive. *Partial.*
- Right window (2–4s): You hold your ground with a nod. He backs off. *Win.*
- Late tap (4–6s): You waited too long. He reads it as challenge. *Fail → auto-triggers fight.*

**Hold outcome (fight):**
- Fight minigame. Opponent is slow, predictable. Designed to teach the rhythm mechanic.
- Win → scene clears. Lose → Game Over.

**Narrative purpose:** Tutorial scene in disguise. Teaches the tap window and introduces fight rhythm at low difficulty.

---

### Scene 2 — *The Crew*
**Setup:** Daytime. You owe someone. Three guys are waiting. One is calm, one is angry, one is watching. The calm one is speaking. The angry one keeps interrupting. You need to time your response to the calm one's words, not the angry one's noise.

**Decision window:** 5 seconds (shorter — pressure is higher)

**Tap outcomes:**
- Early tap (0–1.5s): You interrupt the calm one. The angry one takes it as aggression. *Fail → fight.*
- Right window (1.5–3.5s): You respond when the calm one pauses. He accepts it. *Win.*
- Late tap (3.5–5s): The angry one fills the silence. You've lost the conversation. *Partial — they let you go but take something from you.*

**Hold outcome (fight):**
- Fight minigame. 3v1 scenario. Rhythm pattern is faster, has two simultaneous tracks (angry one attacks while calm one circles). Significantly harder than Scene 1.
- Win → barely. Lose → Game Over.

**Narrative purpose:** Raises complexity. Tap window is now *socially embedded* — you must read who to respond to, not just when. Fight difficulty jump is intentional.

---

### Scene 3 — *The Roof*
**Setup:** Evening. A rooftop. One person. Someone you know. The confrontation is personal — a betrayal, a debt, an old dispute. The tension here is grief as much as anger. There is no clean win.

**Decision window:** 8 seconds (longer — the scene breathes)

**Tap outcomes:**
- Early tap (0–2s): You say something impulsive. It lands wrong. Relationship severed. *Partial — you leave, but something is broken.*
- Right window (2–5s): You let him finish. You walk away. Cold but intact. *Win.*
- Late tap (5–8s): The silence becomes its own statement. He decides for you. Outcome depends on earlier scene performance — if you won Scene 2 cleanly, he lets it go (*Win*). Otherwise *Fail.*

**Hold outcome (fight):**
- Fight minigame. Hardest. Rhythm is erratic — the opponent is emotional, unpredictable, not a trained fighter. Pattern breaks its own rules deliberately.
- Win → pyrrhic. The game's ending shot is the same regardless: you walk away alone.
- Lose → Game Over.

**Narrative purpose:** Emotional payoff. The "win" is ambiguous. Fighting on a rooftop with someone you know should feel wrong even when you win. The game ends on that note.

---

## 6. Fight Minigame — Full Specification

**Concept:** A one-button rhythm resolution. The screen fills with the brawl. A single beat track drives the pattern. Press in time to land hits / dodge blows. Miss = take damage. Damage fills a loss meter. Fill it completely = you lose the fight.

**Mechanics:**

| Element | Detail |
|---|---|
| **Input** | Same button — Spacebar / Click |
| **Beat cues** | Visual cue (flash/pulse on character) + audio cue (hit sound approaching) |
| **Hit window** | 150ms either side of beat (tight but not brutal) |
| **Miss penalty** | Loss meter advances |
| **Loss meter** | 5 hits to lose (Scene 1), 4 hits (Scene 2), 3 hits (Scene 3) |
| **Pattern complexity** | S1: slow, regular. S2: faster, two-track. S3: irregular, pattern-breaking. |

**What makes it not a GD clone:**
- No scrolling level. No runner. Static brawl screen.
- The beat is driven by the *opponent's* body language, not a music track that plays regardless.
- Missing a beat has a *visual consequence* (your character staggers) before the meter updates. It feels like a fight, not a score.

---

## 7. Technical Architecture

### Stack
- **Engine:** Vanilla JS + HTML5 Canvas (fastest to ship, no build system overhead)
- **Audio:** Web Audio API for beat generation + Howler.js for SFX
- **Art:** Pixel art or high-contrast silhouettes (scope-realistic, atmosphere-appropriate)

### State Machine

```
STATES:
  SCENE_INTRO       → plays scene animation, no input accepted
  DECISION_WINDOW   → input active, tension clock running
  OUTCOME_TAP       → plays tap resolution animation
  FIGHT_INIT        → transition into fight screen
  FIGHT_ACTIVE      → rhythm minigame live
  FIGHT_OUTCOME     → win/lose animation
  SCENE_END         → transition to next scene or game over
  GAME_OVER         → restart prompt
  GAME_WIN          → ending screen
```

### Scene Data Structure
Each scene is a JSON config:
```json
{
  "id": 1,
  "name": "The Corner",
  "decisionWindow": 6000,
  "tapWindows": [
    { "start": 0, "end": 2000, "outcome": "partial" },
    { "start": 2000, "end": 4000, "outcome": "win" },
    { "start": 4000, "end": 6000, "outcome": "fail" }
  ],
  "fightConfig": {
    "lossMeterSize": 5,
    "bpm": 80,
    "patternType": "regular"
  }
}
```

---

## 8. Team Responsibilities

### Adit — Core Systems (Claude Code)
- State machine implementation
- Input handler (tap vs. hold detection, timing logic)
- Fight minigame engine (beat generation, hit detection, loss meter)
- Scene loader (JSON config → runtime state)
- Win/loss/partial outcome routing

**Deliverable priority:** State machine + input handler first. Fight minigame second. Scene loader third.

### Codex Person 1 — Scene Logic & Tension System
- Tension curve per scene (the visual/audio state that rises and falls during decision window)
- Tap outcome branching per scene (dialogue/animation triggers based on timing)
- Scene 3 conditional logic (outcome depends on Scene 2 performance)
- Timeout / no-input penalty handler
- Scene transition screens (text overlays, narrative cards)

**Deliverable priority:** Scene 1 tension curve first (needed for integration). Branching logic second. Scene 3 conditional last.

### Codex Person 2 — Art, Audio & UI
- Character sprites / silhouettes (3 scenes × protagonist + antagonist(s))
- Scene backgrounds (corner / street / rooftop)
- Fight screen layout (brawl visual, beat cue animation, loss meter)
- Beat cue visual design (the pulse/flash that cues the player)
- SFX: ambient, hit sounds, beat track per scene
- Game Over / Win screens
- Font and UI frame

**Deliverable priority:** Scene 1 assets first (needed for integration). Fight screen second. Scenes 2–3 third.

---

## 9. Integration Checkpoints

| Checkpoint | What's integrated | Target |
|---|---|---|
| **CP1** | Input handler live, tap vs. hold works in console | Hour 2 |
| **CP2** | Scene 1 full loop playable (no art, placeholder assets) | Hour 4 |
| **CP3** | Fight minigame playable in Scene 1 | Hour 5 |
| **CP4** | Scene 1 with real art + audio | Hour 6 |
| **CP5** | All 3 scenes integrated, rough assets | Hour 8 |
| **CP6** | Polish pass, win screen, game over screen | Final hour |

---

## 10. Scope Cuts If Time Runs Out

In priority order — cut these before cutting scene count:

1. Scene 3 conditional logic (make it a flat outcome instead)
2. Fight minigame for Scene 3 (replace with auto-fail if you hold)
3. Partial outcomes (collapse to Win / Fail binary)
4. Scene 2 two-track rhythm (make it single-track like Scene 1)
5. Narrative text overlays between scenes

**Do not cut:** Scene count (3 is the minimum for the game to feel like a game), core tap vs. hold mechanic, fight minigame for at least Scene 1.

---

## 11. What This Is Not

- Not a Geometry Dash clone. GD DNA exists only inside the fight minigame, recontextualized as a brawl.
- Not a visual novel. There is no dialogue tree. There is no reading. There is only watching and deciding.
- Not a rhythm game. Rhythm is a tool inside one branch of one mechanic.
- Not a runner. There is no scrolling level. There is no death by obstacle.

---

## 12. The Pitch (30 seconds)

*"One button. Three confrontations. You can't talk your way out and you can't fight your way through everything. You just have to read the room — and decide. Tap to back down. Hold to fight. Either way, you live with it."*

---

*COLD BLOOD — Buildathon 2026*

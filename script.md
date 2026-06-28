# COLD BLOOD — Presentation Script
### Buildathon 2026 | Team Codex-5

---

## 🎯 Presentation Overview

| Section | Duration | Who Speaks |
|---|---|---|
| Opening Hook | ~1 min | Presenter 1 |
| The Concept | ~2 min | Presenter 1 |
| Live Demo | ~4 min | Presenter 2 (driving) + Presenter 1 (narrating) |
| Technical Deep-Dive | ~3 min | Presenter 3 (or Presenter 1) |
| Design Philosophy & Challenges | ~2 min | Any |
| Closing Pitch | ~30 sec | Presenter 1 |
| **Total** | **~12 min** | |

> **TIP:** Adjust timing based on your actual slot. If you only have 5 minutes, skip the Technical Deep-Dive and shorten the demo to 2 minutes.

---

## PART 1 — Opening Hook (~1 min)

**[SLIDE: Black screen. Just the words "ONE BUTTON."]**

> *"Imagine a game where you have exactly one button. That's it. One button to talk your way out of a fight. One button to throw a punch. One button to decide if you walk away — or if you don't."*

**[SLIDE: Title card — COLD BLOOD logo]**

> *"This is COLD BLOOD. A single-player street confrontation game where every encounter comes down to a single question: do you press the button, or do you hold it?"*

**[Beat — let it sink in]**

> *"Tap to de-escalate. Hold to fight. That's the entire control scheme. No menus. No dialogue trees. No second controller. Just one button, and the weight of every decision behind it."*

---

## PART 2 — The Concept (~2 min)

**[SLIDE: Game loop diagram — TAP vs HOLD branching]**

> *"Here's how COLD BLOOD works. You walk into a confrontation. The tension rises. A timer starts counting down. You have a window — sometimes 6 seconds, sometimes only 3 — to decide."*

> *"If you TAP the spacebar — a quick press, under 300 milliseconds — you try to de-escalate. You try to talk your way out. But timing matters. Tap too early, you flinch. Tap too late, you've already lost the conversation. There's a sweet spot, and it's different for every scene."*

> *"If you HOLD the spacebar — press and keep holding past 300 milliseconds — you choose violence. The game drops you into a one-button rhythm brawl. Beats flash on screen. You press in time to land hits. Miss the beat, you take damage. Take too many hits, it's game over."*

**[SLIDE: The 5 scenes — names and thumbnails]**

> *"The game has five escalating encounters:"*
>
> 1. *"**The Corner** — a stranger blocks your path on a dark street. Low stakes. This is your tutorial."*
> 2. *"**The Crew** — three guys, you owe someone money. The pressure is real."*
> 3. *"**The Roof** — someone you know. It's personal. There is no clean win here."*
> 4. *"**The Subway** — The Syndicate sends a welcome party underground. Fast. Brutal."*
> 5. *"**The Syndicate** — the final boss. His penthouse. His rules. 3 seconds to decide. 160 BPM to survive."*

> *"Each scene gets harder. The decision windows get shorter. The fights get faster. And the dialogue gets heavier."*

---

## PART 3 — Live Demo (~4 min)

> **IMPORTANT:** Before the presentation, have the game running at `localhost:3000` in full-screen Chrome. Make sure the browser is focused so spacebar works. Practice the demo path at least twice.

### Demo Script

**[Open browser — Title Screen is showing]**

> *"So let's play it. Here's COLD BLOOD running live."*

**[Press SPACE — Title screen fades, Scene 1 begins]**

> *"Scene 1: The Corner. Watch the dialogue — it plays out like a graphic novel. The characters trade words through speech bubbles."*

**[Press SPACE through the intro dialogue lines — let the audience read them]**

> *"Notice — I'm pressing spacebar to advance each line. One button. Even the story is driven by it."*

**[Decision Window starts — the timer appears, tension overlay rises]**

> *"Now the decision window is live. See that timer counting down? That red glow creeping in? I have 6 seconds. The game is asking me — do I tap, or do I hold?"*

**[OPTION A — Demonstrate a TAP at the right moment]**

> *"I'm going to time my tap carefully... NOW."*
> *"I tapped in the sweet spot. The character says 'Step aside.' We de-escalated. Scene cleared. No fight needed."*

**[OPTION B — Demonstrate a HOLD to show the fight]**

> *"But what if I held instead? Watch — I'm holding the spacebar..."*
> *"FIGHT. The game drops into the rhythm brawl. See those rings contracting toward the center? I press when they converge. Hit — my character lunges. Miss — I take damage and the enemy attacks."*
> *"I survived. The fight scene clears."*

**[Advance to Scene 2 — show the dialogue]**

> *"Scene 2: The Crew. Notice the dialogue is different — there are more lines, more tension. 'There are three of you, and one of me.' 'Yeah, and we brought a knife.' 'You should've brought a gun.' — every line, one spacebar press."*

**[Either play through or skip to Scene 4/5 to show variety]**

> *"Let me jump ahead to show you the escalation..."*

**[Show Scene 4 or 5 — point out the shorter timer, faster BPM]**

> *"Scene 5 — The Syndicate. The final boss. Look at the decision window: only 3 seconds. And if I fight? 160 BPM. The rhythm is irregular — it deliberately breaks its own pattern. This is designed to feel chaotic, like fighting someone unpredictable."*

**[End the demo — either win or game over, both are fine]**

> *"And that's COLD BLOOD. Five scenes. One button. Every press matters."*

---

## PART 4 — Technical Deep-Dive (~3 min)

**[SLIDE: Architecture diagram]**

> *"Let me walk you through how we built this."*

### Stack

> *"The game is built on **Next.js** with **React** and **TypeScript**. We chose this because it gives us server-side rendering for fast loads, a component architecture for clean separation, and TypeScript for type safety during a fast buildathon sprint."*

### The State Machine

> *"At the heart of the game is a **finite state machine**. Every screen you saw — the intro, the decision window, the outcome, the fight, game over, game win — those are all states. The game transitions between them based on your input."*

**[SLIDE: State machine diagram]**

```
SCENE_INTRO → DECISION_WINDOW → OUTCOME_TAP → SCENE_END → next scene
                    ↓
               FIGHT_INIT → FIGHT_ACTIVE → SCENE_END or GAME_OVER
```

> *"This architecture means the game is extremely deterministic. There's one source of truth — the state — and every component just reacts to it. No spaghetti logic."*

### The One-Button System

> *"The input handler is a custom React hook. It listens for spacebar keydown. If you release before 300 milliseconds — that's a tap. If you're still holding at 300ms, the hold fires immediately. You don't even have to let go. This makes the controls feel snappy and responsive."*

### The Rhythm Engine

> *"The fight minigame runs on an HTML5 Canvas with `requestAnimationFrame` for smooth 60fps rendering. Beat timestamps are generated from the scene's BPM config. We support three pattern types: regular, two-track, and irregular. The hit window is 150ms on either side of the beat — tight enough to be challenging, forgiving enough to be fair."*

### Scene Data

> *"All scene configurations — dialogue, tap windows, fight difficulty — are stored in a single `scenes.json` file. Adding a new scene is as simple as adding a new JSON object. We went from 3 scenes to 5 without touching a single line of game logic code."*

### AI-Generated Art

> *"Every image in the game — the backgrounds, the character portraits, the game over screen — was generated using AI image generation during the buildathon. We defined a consistent art direction — gritty comic book graphic novel, neo-noir — and generated each asset to match. This let us achieve a visual quality that would normally require a dedicated artist."*

---

## PART 5 — Design Philosophy & Challenges (~2 min)

**[SLIDE: "What makes this different?"]**

> *"Let me talk about what makes COLD BLOOD different from what you might expect."*

### It's NOT a Geometry Dash clone

> *"Yes, the fight minigame has rhythm mechanics. But COLD BLOOD is not a rhythm game. The rhythm exists only inside one branch of one mechanic. The outer game — the confrontations, the social tension, the timing of your response — that's entirely original. We took GD DNA and recontextualized it as a street brawl."*

### Social tension as the obstacle

> *"Most games give you enemies, platforms, puzzles. We give you a conversation you might lose. The obstacle is social — you're reading body language, timing your response to what someone says. That's the innovation."*

### One button, two dimensions

> *"When you press and how long you press — that's our entire design space. And from those two variables, we built a game with branching outcomes, escalating difficulty, and a full narrative arc across five scenes."*

### Challenges We Faced

> *"The biggest challenge was making one button feel like enough. Early playtests felt flat because the decision didn't carry weight. We solved this with the tension system — the screen literally changes as time runs out. Red overlays creep in. The timer pulses. Your character's portrait darkens. By the time you press, you feel the pressure."*

> *"Another challenge was the dialogue system. Originally, the intro was a static 3-second screen. Players felt disconnected. So we rebuilt it as an interactive conversation — you press space to advance each line. Suddenly the one-button philosophy extended into the narrative itself. The whole game became one button."*

---

## PART 6 — Closing Pitch (~30 sec)

**[SLIDE: Black screen. The 30-second pitch.]**

> *"One button. Five confrontations. You can't talk your way out of everything, and you can't fight your way through everything. You just have to read the room — and decide."*

> *"Tap to back down. Hold to fight."*

> *"Either way, you live with it."*

**[SLIDE: COLD BLOOD — Buildathon 2026 — Team Codex-5]**

> *"Thank you."*

---

## 📋 Pre-Presentation Checklist

- [ ] Game running at `localhost:3000` in full-screen Chrome
- [ ] Browser focused (so spacebar doesn't scroll the page)
- [ ] Sound on (if you have audio) / Sound off (if you don't — the game works silently)
- [ ] Practice the demo path — know which scene you'll show and which outcome you'll trigger
- [ ] Have a backup plan: if the game crashes, switch to screenshots and keep talking
- [ ] Slide deck loaded (if using one alongside the demo)

## 🎤 Speaker Tips

- **Don't read the dialogue out loud during demo** — let the audience read the speech bubbles themselves. Just narrate what's happening mechanically.
- **Pause after the opening hook** — let the "one button" concept land before explaining it.
- **During the fight demo**, narrate hits and misses in real-time: *"Hit! Hit! Missed — see, the enemy just attacked me. My health dropped."*
- **If you game over during the demo**, own it: *"And that's what happens when you miss too many beats. Game over. No checkpoints. No mercy. That's COLD BLOOD."*
- **End strong.** The closing pitch should be delivered from memory, not read. Make eye contact. Let the last line hang.

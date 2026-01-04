---
name: web-developer
description: Frontend development, React components, Next.js, TypeScript, Tailwind CSS
---

# Web Developer Agent

You are a web developer agent working on **Galamath**, a math quiz application for children with AI-powered tutoring.

> **CRITICAL: This app is primarily used on iPads.** All UI decisions, touch interactions, audio handling, and component sizing must be optimized for iPad use. Always consider iOS Safari quirks, touch gestures, and tablet screen sizes as the primary target.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **AI**: Vercel AI SDK with OpenAI (GPT-4o-mini for explanations, TTS for audio)
- **Database**: Vercel Postgres (optional)
- **Email**: Resend API

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home: passcode → user → theme selection
│   ├── quiz/page.tsx       # Quiz interface (40 questions)
│   ├── results/page.tsx    # Score display, mistakes review
│   └── api/
│       ├── auth/route.ts   # Passcode validation
│       ├── users/route.ts  # User list from env
│       ├── results/route.ts# Save results + email notification
│       ├── explain/route.ts# AI tutoring (streaming text)
│       └── speak/route.ts  # Text-to-speech (OpenAI TTS)
├── components/
│   ├── AIHelper.tsx        # Dancing cat AI tutor with streaming audio
│   ├── QuestionCard.tsx    # Question + 4 answer options
│   ├── Timer.tsx           # Countdown timers
│   ├── ProgressBar.tsx     # Quiz progress indicator
│   ├── UserSelector.tsx    # User profile picker
│   ├── PasscodeScreen.tsx  # Access control
│   └── ThemeCard.tsx       # Theme selection cards
├── data/                   # Quiz JSON files
│   └── {themeId}-{level}.json  # 40 questions each
└── lib/
    └── types.ts            # TypeScript interfaces
```

## Quiz Data Format

Quiz files are at `src/data/{themeId}-{level}.json`. See `/CLAUDE.md` for the full schema.

```json
{
  "theme": "Display Name",
  "themeId": "url-friendly-id",
  "level": "easy|medium|hard",
  "totalTimeMinutes": 90,
  "questionTimeMinutes": 2,
  "questions": [
    {
      "id": 1,
      "question": "What is 3 + 4 × 2?",
      "answers": ["14", "11", "10", "9"],
      "correct": 1,
      "hint": "Remember PEMDAS!"
    }
  ]
}
```

## Key Patterns

### AIHelper Chat Interface (AIHelper.tsx)
- **Slide-up drawer**: Opens as a modal covering 75% of screen height
- **Chat bubbles**: Conversation-style UI with user/assistant messages
- **3 question limit**: Users can ask up to 3 follow-up questions
- **React Portal**: Uses `createPortal(element, document.body)` to escape parent transforms (required for fixed positioning to work inside transformed containers)

### Audio/TTS (AIHelper.tsx)
- **Sequential sentence processing**: TTS requests are made one at a time (fetch → play → next). This prevents out-of-order playback when multiple requests complete at different times.
- **iOS audio unlock**: Must play silent AudioContext buffer synchronously on user gesture:
  ```typescript
  const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
  const source = audioContextRef.current.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContextRef.current.destination);
  source.start(0);
  ```
- **Sentence detection**: Regex `/^[^.!?]*[.!?]+\s*/` extracts complete sentences from streaming text

### State Management
- **Quiz progress**: `localStorage.quizProgress` - survives page refresh
- **Round data**: `sessionStorage.quizResult` - tracks wrong questions for round 2
- **Auth**: `localStorage.unlocked` - simple boolean

### Quiz Flow
1. Passcode entry → User selection → Theme/level selection
2. Quiz: 40 questions, keyboard shortcuts (A-D), timers
3. Results: Score, time breakdown, mistakes with hints
4. Round 2+: Re-quiz on missed questions with AI helper available

### API Routes
- All use standard Next.js Route Handlers
- AI endpoints use Vercel AI SDK streaming
- Results API queues failed submissions in localStorage for retry

## Environment Variables

```
PASSCODE=1234
USERS=Zoe,Iris,Rose
NOTIFICATION_EMAIL=parent@example.com
RESEND_API_KEY=...
OPENAI_API_KEY=...
POSTGRES_URL=...  # Optional
```

## Common Tasks

### Adding a new quiz theme
1. Create `src/data/{themeId}-{level}.json`
2. Follow schema in `/CLAUDE.md`
3. Ensure correct answers are distributed evenly across positions A-D
4. Make wrong answers plausible (common mistakes)

### Modifying AI behavior
- Explanation prompt: `src/app/api/explain/route.ts`
- TTS settings (voice, speed): `src/app/api/speak/route.ts`
- Audio playback logic: `src/components/AIHelper.tsx`

### Styling
- Global CSS variables in `src/app/globals.css`
- Tailwind classes throughout components
- Font: Nunito (loaded in layout.tsx)

## iPad-First Development (Primary Platform)

This app runs primarily on iPads. Every feature must work flawlessly on iPad/iOS Safari.

### iOS Safari Quirks
- **AudioContext restrictions**: iOS blocks audio playback unless triggered synchronously from a user gesture. Always play a silent buffer on the first tap before any async work (see Audio/TTS section).
- **Fixed positioning inside transforms**: `position: fixed` breaks when any ancestor has a CSS transform. Use `createPortal(element, document.body)` for modals/drawers.
- **Safe area insets**: Use `env(safe-area-inset-bottom)` for bottom padding on devices with home indicators.
- **100vh issues**: Use `100dvh` (dynamic viewport height) instead of `100vh` to account for Safari's address bar.

### Touch Interactions
- **Touch vs Click detection**: Uses `onTouchEnd` + `onClick` with a ref to prevent double-firing. Touch triggers "double highlight" animation and auto-advance after 1 second; mouse click just selects.
- **Touch-optimized button sizes**: Minimum 44x44px tap targets.
- **No hover states**: Don't rely on hover for critical UI—there's no hover on touch devices.

### Keyboard Handling
- **External keyboard support**: iPads can have keyboards attached, so A/B/C/D shortcuts are still useful.
- **Keyboard handler safety**: Check `e.target.tagName` to ignore events from INPUT/TEXTAREA elements (prevents answer selection while typing in chat).

### Layout & Sizing
- **iPad font size adjustments**: 768px-1024px breakpoint in globals.css increases base font size.
- **Landscape/Portrait**: UI should work in both orientations.
- **Large touch targets**: Buttons and interactive elements sized for finger taps, not mouse clicks.

## Timer UI (Timer.tsx, CircularTimer.tsx)
- **Centered layout**: Both timers are centered on screen, above the progress bar
- **Total timer**: No label, blinking colon (toggles every 500ms), shows H:MM when >= 1 hour, otherwise MM:SS
- **Question timer**: Small circular SVG progress bar (40x40), shows seconds only, color-coded (indigo → orange at 10s → red at 5s)

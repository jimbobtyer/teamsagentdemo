# Teams Shell

A high-fidelity static shell of the Microsoft Teams Chat UI, meant as a starting point for prototyping new Teams features. Fork this repo, drop in your idea, and you'll have a realistic-looking Teams surface from day one — so the prototyping work goes into the feature, not the chrome.

## What's inside

- **Teams chat UI** — title bar, nav rail, chat list, chat view, compose, sessions rail, agents rail, channel-post threads
- **Realistic mock data** — contacts, conversations, agents, sessions, channels and channel posts — populated so the shell looks lived-in out of the box
- **Reactions, @mentions, reply threads, Adaptive Cards** — the message-level patterns partners expect from Teams, ready to wire up
- **Persona-anchored copy** — seeded content reads like a real person's Teams. See [`PERSONA.md`](PERSONA.md) for the character sheet driving message content
- **Component-scoped styling** — each `.jsx` has a sibling `.css`, no Tailwind or CSS-in-JS
- **Design guide** — color tokens, spacing, typography, card patterns, and layout decisions in [`DESIGN_GUIDE.md`](DESIGN_GUIDE.md)
- **Reference assets** — [`images/avatars/`](images/avatars/) holds agent logo/avatar sources used to build the UI (Copilot, Designer, Jira, Claude)

Nothing is wired to a backend. The shell is static on purpose — prototypes stay small, fast, and easy to hand off.

## Plant Wrangler walkthrough

The app opens in **Plant Operations | Launch Readiness**, with a shared channel
thread already open. All people, source material and manufacturing data are
fictional. The original shell conversations remain available.

Run `npm run dev` (or `npm.cmd run dev` from Windows PowerShell). For recording,
use a 1920x1080 viewport at 100% zoom; 1440px wide also supports all four panels.
The introduction is available under the title-bar menu's **About this prototype**,
but does not interrupt the opening shot.

Three-minute recording timeline (the footer shows the current filming beat):

| Time | On screen / dialogue | Capability cue |
|---|---|---|
| **0:00–0:25 — Ask** | Send Maya's prepared question: “@Plant Wrangler, can Line 3 take this rush order before launch?” | Channel @mention; one shared question and outcome. |
| **0:25–1:00 — Check and answer** | “Checking capacity,” then “Reviewing changeover procedure.” A formatted table progressively reveals capacity, constraints and three source references. | Work-status updates, simulated channel streaming, Extended Markdown-style tables and citations. Activity updates are not private reasoning. |
| **1:00–1:45 — Explore an option** | Click **Explore schedule options**. Compare **Current schedule** (82%, 9 pp gap) with **Proposed adjustment** (91%, +6 pp overtime / +3 pp changeover). Select the proposal and **Prepare for approval**. | Embedded HTML interaction using prepared local data and app logic. Two options, not a dashboard. No decision is made by the widget. |
| **1:45–2:30 — Decide** | The selected plan appears in an Adaptive Card. **Approve** opens Elena's explicit decision. Confirm as Elena to update the same card with her name and timestamp. | Card actions, actor identity and a local actor-check simulation. Other demo actors cannot approve. |
| **2:30–3:00 — Confirm** | Click **Post agreed plan**. The agent confirms the plan and source links in the same thread; the local decision log remains visible. | Multi-user collaboration, thread context and an in-session recorded decision. Approval does not change the production schedule. |

Suggested closing narration: “The team understood the options, chose a path,
and recorded the decision, all in Teams.”

Progress is deterministic: each status lasts 1.1 seconds; the three table rows
arrive at 0.7-second intervals. These are local visual simulations, not live
Teams streaming or a Markdown service. The displayed timeline is presenter
pacing, not a three-minute automatic playback.

**Next scene** can advance each status, complete the table, open the widget,
select the proposal, prepare its card, open Elena's confirmation and post the
agreed plan. It never bypasses the explicit human confirmation. **Reset demo**
clears progress, messages, reactions, option selection, dialogs, decisions and
supplemental actions. Refresh always starts from the same opening; no scenario
data is stored in browser storage.

The final message also offers **Execution evidence** and **Optional follow-up**.
David's three-plant access-aware answer and the editable change-control meeting
remain available there, outside the main recording path. Meeting scheduling is
a local mock only. **Request changes** retains the staffing-checkpoint revision
branch. The channel's optional conceptual production architecture remains
product-neutral until its service mapping is expanded.

Implementation: local fixtures and a pure guarded reducer in
[`src/data/plantWrangler.js`](src/data/plantWrangler.js), re-exported by the data
barrel; scenario UI in
[`PlantWranglerChannel`](src/components/PlantWranglerChannel.jsx). It reuses
`MessageRow`, the shell's Adaptive Card renderer, `ChannelThreadRail`, `ChatHeader`,
`Avatar`, `IconButton` and `TypingIndicator`. Adaptive Cards are the shell's visual
React representation, not an external Adaptive Cards runtime. The option widget
is local semantic HTML, not an installed Teams widget or a connected tool.

No authenticated identity, production authorization, retrieval, equipment
control, calendar API, workflow service or telemetry backend is implemented.
The reducer checks the selected demo actor against Elena's ID before recording
approval; this browser-side guard is not a security boundary. Decisions persist
within the current app session, including navigation away and back, not across
refreshes or between users. All transitions are local React state. No external
API is called, and approval never updates the production schedule.

Run the deterministic scenario checks with
`node --test tests/plantWrangler.test.js` (use
`node --test tests\plantWrangler.test.js` in Windows PowerShell). These use Node's
built-in test runner; there is no added test-framework dependency.

## Quick start

Requires Node 20.19+ (Vite 8 requirement).

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Project layout

```
teams-shell/
├── CLAUDE.md             Guidance for AI coding assistants working in this repo
├── DESIGN_GUIDE.md       Color tokens, spacing, icons, typography, card patterns
├── PERSONA.md            The fictional user persona driving all seeded copy
├── README.md
├── images/               Reference assets
│   └── avatars/          Agent logo/avatar sources (Copilot, Designer, Jira, Claude)
├── public/avatars/       Static avatar images
└── src/
    ├── App.jsx           Four-panel layout root
    ├── data.js           Barrel re-export of everything in data/
    ├── components/       TitleBar, NavRail, ChatList, ChatView (ChatHeader, Compose),
    │   │                  MessageRow, MessageActions, PromptSuggestions,
    │   │                  SessionsRail, AgentsRail, ChannelThreadRail
    │   └── common/       Shared primitives (Avatar, LinkCard, Icon, IconButton, ...)
    └── data/             Mock contacts, messages, agents, sessions, channel posts,
                          prompt suggestions
```

## Prototyping a feature

1. **Set up the scenario** — edit the mock data in `src/data/` to add a chat, channel post, agent, message thread, or session that fits your feature. All files are re-exported from `src/data.js` — import from there.
2. **Make the current user yours** — update `currentUser` in `src/data/contacts.js` (name, initials, avatar). The default avatar is a generic placeholder at `public/avatars/user.jpg`.
3. **Match the voice** — when adding messages, read [`PERSONA.md`](PERSONA.md) and reuse the listed collaborators, projects, and communication style instead of inventing new ones.
4. **Build or extend a component** in `src/components/` — every component has a scoped `.css` sibling. Reach for primitives in `components/common/` (Avatar, IconButton, Icon library, LinkCard, PrivateDisclaimer) before rolling your own.
5. **Match the visual language** — reference [`DESIGN_GUIDE.md`](DESIGN_GUIDE.md) for colors, spacing, typography, and the Adaptive Cards pattern for agent-sent rich content.
6. **Ship it** — `npm run build` produces a static bundle you can host anywhere.

## Stack

React 19, Vite 8. No routing, no state management library, no backend — deliberately small so the code stays easy to read and modify.

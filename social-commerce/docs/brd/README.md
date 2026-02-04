# Business Requirements Documents (BRD)

## Feature Overview

| ID       | Feature                                                               | Status | Description                                |
|----------|-----------------------------------------------------------------------|--------|--------------------------------------------|
| FEAT-001 | [Profile & Authentication](./0.profile-and-authentication.md)         | DRAFT  | Đăng ký/đăng nhập bằng phone + 6-digit PIN |
| FEAT-002 | [Voice-First Social Feed](./2-voice-first-social-feed.md)             | DONE   | TikTok-style feed + gesture control        |
| FEAT-003 | [Pose Detection](./3-rule-base-detection-for-handup-to-scoll-feed.md) | DONE   | MediaPipe gesture → scroll feed            |
| FEAT-004 | [Store & Product Chatbot](./4-store-and-product-chatbot.md)           | DRAFT  | Store badge + Vietnamese product chatbot   |

## Status Legend

| Status  | Description             |
|---------|-------------------------|
| DRAFT   | Đang planning/design    |
| ACTIVE  | Đang implement          |
| PAUSED  | Tạm dừng                |
| DONE    | Hoàn thành              |
| BLOCKED | Bị block bởi dependency |

---

## Current Application State

### Main Screen: VoiceFeed with Gesture Control

```
┌─────────────────────────────────────────────────────────────────┐
│  📷●                                              🔊  ⚙️        │
│  ↑ Pose indicator                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌─────────┐                             │
│                         │  😊     │  ← CuteFace                 │
│                         └─────────┘                             │
│                                                                 │
│              ┌───────────────────────────────┐                  │
│              │  "Xin chào!..."               │ ← Speech Bubble  │
│              └───────────────────────────────┘                  │
│                                                                 │
│   💬 Comments                                                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🎤  Voice comment                                      │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Controls:
- Scroll / Swipe: Navigate feeds
- Keyboard j/k: Next/Prev feed
- 🤚 Hand UP (left or right): Next feed
- Infinite scroll: Loops back to first when reaching last
```

---

## Frontend Structure

```
front-end/src/
├── App.tsx                      # Entry → VoiceFeed
├── main.tsx                     # React entry point
├── components/
│   ├── chat/
│   │   ├── ChatLayout.tsx       # Layout wrapper ✅
│   │   ├── CuteFace.tsx         # Animated face ✅
│   │   └── MessageBubble.tsx    # Message display ✅
│   ├── feed/
│   │   ├── VoiceFeed.tsx        # Main feed ✅
│   │   ├── FeedItem.tsx         # Full-screen item ✅
│   │   ├── SpeechBubble.tsx     # Text bubble ✅
│   │   ├── CommentsList.tsx     # Comments ✅
│   │   ├── VoiceCommentButton.tsx # Voice record ✅
│   │   └── PoseIndicator.tsx    # Pose status ✅
│   ├── pose/
│   │   ├── PoseDetector.tsx     # Standalone demo ✅
│   │   ├── PoseDemo.tsx         # Demo page ✅
│   │   └── index.ts             # Module exports ✅
│   ├── ui/                      # (empty - shadcn/ui placeholder)
│   └── layout/                  # (empty - placeholder)
├── hooks/
│   ├── useFeed.ts               # Feed data ✅
│   ├── useComments.ts           # Comments ✅
│   ├── useChat.ts               # Chat messages ✅
│   ├── useGoogleTTS.ts          # Google TTS ✅
│   ├── useTextToSpeech.ts       # Web Speech TTS ✅
│   ├── useSpeechToText.ts       # STT ✅
│   ├── usePoseDetection.ts      # MediaPipe ✅
│   ├── useGestureControl.ts     # Gesture→scroll ✅
│   ├── useWebSocket.ts          # WebSocket ✅
│   └── useDogSelection.ts       # Dog avatar ✅
├── types/
│   ├── feed.ts                  # ✅
│   ├── comment.ts               # ✅
│   ├── chat.ts                  # ✅
│   └── pose.ts                  # ✅
├── config/
│   └── dogs.ts                  # Dog avatar config ✅
├── lib/
│   ├── api.ts                   # API client ✅
│   └── utils.ts                 # Utilities ✅
└── providers/
    └── QueryProvider.tsx        # React Query ✅
```

## Backend Structure

```
backend/app/
├── main.py                      # FastAPI app ✅
│                                # - CORS configured
│                                # - Health check: GET /health
├── api/v1/
│   ├── __init__.py              # Router config ✅
│   ├── feed.py                  # GET /api/v1/feed ✅
│   │                            # - Returns 8 mock feed items
│   ├── tts.py                   # TTS API ✅
│   │                            # - POST /synthesize
│   │                            # - GET /voices
│   ├── comments.py              # Comments API ✅
│   │                            # - POST / (create)
│   │                            # - GET /{feed_id}
│   │                            # - DELETE /{comment_id}
│   └── pose.py                  # Pose API ✅
│                                # - POST /detect
│                                # - GET /gestures
├── schemas/
│   ├── __init__.py              # ✅
│   ├── feed.py                  # FeedItem, FeedResponse ✅
│   ├── comment.py               # Comment, CommentCreate ✅
│   └── pose.py                  # LandmarkSchema, GestureResponse ✅
└── services/
    ├── __init__.py              # ✅
    ├── tts.py                   # GoogleTTSService ✅
    │                            # - 8 Vietnamese voices
    │                            # - 6 voice presets
    └── pose_detection.py        # PoseGestureDetector ✅
                                 # - 10 supported gestures
                                 # - Rule-based detection

Note: Database (PostgreSQL/SQLAlchemy), Auth (JWT), Models, and
Repositories are NOT yet implemented. Currently using in-memory storage.
```

---

## Next Steps (Priority Order)

1. **FEAT-004** - Store & Product Chatbot (NEW)
    - [ ] Store badge (🏪) on feed
    - [ ] Product catalog với mock data
    - [ ] Vietnamese intent detection
    - [ ] Chatbot auto-reply

2. **FEAT-002/003** - Voice Feed + Pose Detection ✅ DONE
    - [x] Create PoseIndicator component
    - [x] Create useGestureControl hook
    - [x] Add camera permission flow
    - [ ] Polish animations và transitions

3. **FEAT-001** - Authentication (NOT STARTED)
    - [ ] Setup database (PostgreSQL + SQLAlchemy)
    - [ ] Implement auth API
    - [ ] Create login/register UI

4. **Technical Debt**
    - [ ] Replace in-memory storage with PostgreSQL
    - [ ] Add shadcn/ui components
    - [ ] Add unit tests (currently 0% coverage)

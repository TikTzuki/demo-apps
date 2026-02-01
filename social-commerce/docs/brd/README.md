# Business Requirements Documents (BRD)

## Feature Overview

| ID       | Feature                                                               | Status | Description                                |
|----------|-----------------------------------------------------------------------|--------|--------------------------------------------|
| FEAT-001 | [Profile & Authentication](./0.profile-and-authentication.md)         | DRAFT  | Đăng ký/đăng nhập bằng phone + 6-digit PIN |
| FEAT-002 | [Voice-First Social Feed](./2-voice-first-social-feed.md)             | ACTIVE | TikTok-style feed + gesture control        |
| FEAT-003 | [Pose Detection](./3-rule-base-detection-for-handup-to-scoll-feed.md) | ACTIVE | MediaPipe gesture → scroll feed            |

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
├── components/
│   ├── chat/
│   │   └── CuteFace.tsx         # Animated face ✅
│   ├── feed/
│   │   ├── VoiceFeed.tsx        # Main feed ✅
│   │   ├── FeedItem.tsx         # Full-screen item ✅
│   │   ├── SpeechBubble.tsx     # Text bubble ✅
│   │   ├── CommentsList.tsx     # Comments ✅
│   │   ├── VoiceCommentButton.tsx # Voice record ✅
│   │   └── PoseIndicator.tsx    # Pose status 🔲 TODO
│   └── pose/
│       ├── PoseDetector.tsx     # Standalone demo ✅
│       └── PoseDemo.tsx         # Demo page ✅
├── hooks/
│   ├── useFeed.ts               # Feed data ✅
│   ├── useComments.ts           # Comments ✅
│   ├── useGoogleTTS.ts          # TTS ✅
│   ├── usePoseDetection.ts      # MediaPipe ✅
│   └── useGestureControl.ts     # Gesture→scroll 🔲 TODO
└── types/
    ├── feed.ts
    ├── comment.ts
    └── pose.ts                  # ✅
```

## Backend Structure

```
backend/app/
├── main.py                      # FastAPI app ✅
├── api/v1/
│   ├── feed.py                  # GET /api/v1/feed ✅
│   ├── tts.py                   # TTS API ✅
│   ├── comments.py              # Comments API ✅
│   └── pose.py                  # Pose API ✅
├── schemas/
│   ├── feed.py                  # ✅
│   ├── comment.py               # ✅
│   └── pose.py                  # ✅
└── services/
    ├── tts.py                   # Google TTS ✅
    └── pose_detection.py        # Rule-based ✅
```

---

## Next Steps (Priority Order)

1. **FEAT-002/003** - Integrate pose detection into VoiceFeed
    - [ ] Create PoseIndicator component
    - [ ] Create useGestureControl hook
    - [ ] Add camera permission flow

2. **FEAT-001** - Authentication
    - [ ] Setup database (PostgreSQL + SQLAlchemy)
    - [ ] Implement auth API
    - [ ] Create login/register UI

# FEAT-002: Voice-First Social Feed

**Status:** ACTIVE

---

## 1. Proposal

### Problem Statement

Ứng dụng này phục vụ người Việt Nam với giao diện social feed theo phong cách TikTok/Shorts. Người dùng có thể xem feed,
nghe nội dung được đọc tự động, comment bằng giọng nói, và điều khiển feed bằng cử chỉ tay.

### Proposed Solution

- Sử dụng CuteFace làm avatar cho mỗi feed item với animations
- Scroll lên/xuống để xem các feed mới (snap scrolling)
- Auto-play TTS khi feed item active
- Voice comment bằng cách giữ nút microphone
- **Gesture control:** Tự động bật pose detection khi user cho phép camera, hiển thị icon nhỏ để indicate trạng thái

### User Stories

- Là một người dùng, tôi mở ứng dụng và thấy khuôn mặt CuteFace thân thiện
- Scroll lên hoặc xuống và thấy các feed mới với khuôn mặt CuteFace
- CuteFace tự động đọc nội dung feed với hộp thoại tin nhắn text
- Giữ nút microphone để comment bằng giọng nói
- **Khi cho phép camera, tôi giơ 1 tay lên để scroll lên feed trước**
- **Khi cho phép camera, tôi giơ 1 tay xuống để scroll xuống feed tiếp theo**
- **Tôi thấy icon nhỏ ở góc màn hình cho biết pose detection đang hoạt động**

### Requirements

| ID        | Requirement                                                       | Priority |
|-----------|-------------------------------------------------------------------|----------|
| FR-002-01 | Hiển thị feed dạng full-screen với snap scroll                    | High     |
| FR-002-02 | CuteFace avatar với animation                                     | High     |
| FR-002-03 | Auto-play TTS khi feed active                                     | High     |
| FR-002-04 | Speech bubble hiển thị text đang đọc                              | Medium   |
| FR-002-05 | Voice comment (hold to record)                                    | High     |
| FR-002-06 | Hiển thị comments list                                            | Medium   |
| FR-002-07 | Keyboard navigation (j/k, arrows)                                 | Low      |
| FR-002-08 | **Pose detection auto-enable khi camera allowed**                 | High     |
| FR-002-09 | **Gesture control: hand up = scroll up, hand down = scroll down** | High     |
| FR-002-10 | **Pose indicator icon (small, corner)**                           | Medium   |

---

## 2. Wireframes

### Screen: Voice Feed with Gesture Control

```
┌─────────────────────────────────────────────────────────────────┐
│  📷●                                              🔊  ⚙️        │
│  ↑ Pose indicator (green = active, gray = off)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌─────────┐                             │
│                         │         │                             │
│                         │  😊     │  ← CuteFace                 │
│                         │         │                             │
│                         └─────────┘                             │
│                                                                 │
│              ┌───────────────────────────────┐                  │
│              │  "Xin chào! Đây là nội dung   │ ← Speech Bubble  │
│              │   của feed item này..."       │                  │
│              └───────────────────────────────┘                  │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   💬 Comments (3)                                               │
│   ├── User1: "Hay quá!"                                         │
│   ├── User2: "Cảm ơn bạn"                                       │
│   └── User3: "👍"                                               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🎤  Giữ để comment bằng giọng nói                      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pose Indicator States

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   📷●  = Camera ON, Pose Detection ACTIVE (green dot)            │
│                                                                  │
│   📷○  = Camera ON, Pose Detection PAUSED (gray dot)             │
│                                                                  │
│   📷✕  = Camera permission DENIED (red x)                        │
│                                                                  │
│   (no icon) = Camera not requested yet                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Gesture Actions

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   🤚 Left/Right Hand UP above shoulder                           │
│   → Scroll to PREVIOUS feed (scroll up)                          │
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   👇 Left/Right Hand DOWN below hip                              │
│   → Scroll to NEXT feed (scroll down)                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### First-time Camera Permission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         ┌─────────┐                             │
│                         │  😊     │                             │
│                         └─────────┘                             │
│                                                                 │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                                                           │ │
│   │   📷 Bật điều khiển bằng cử chỉ?                          │ │
│   │                                                           │ │
│   │   Giơ tay lên/xuống để chuyển feed                        │ │
│   │                                                           │ │
│   │   ┌─────────────┐    ┌─────────────┐                      │ │
│   │   │   Cho phép  │    │   Để sau    │                      │ │
│   │   └─────────────┘    └─────────────┘                      │ │
│   │                                                           │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Code Analysis

### Related Files

| File                                                   | Purpose                 | Status |
|--------------------------------------------------------|-------------------------|--------|
| `front-end/src/components/feed/VoiceFeed.tsx`          | Main feed container     | ✅ Done |
| `front-end/src/components/feed/FeedItem.tsx`           | Single feed item        | ✅ Done |
| `front-end/src/components/feed/SpeechBubble.tsx`       | Text bubble             | ✅ Done |
| `front-end/src/components/chat/CuteFace.tsx`           | Animated face           | ✅ Done |
| `front-end/src/components/feed/CommentsList.tsx`       | Comments display        | ✅ Done |
| `front-end/src/components/feed/VoiceCommentButton.tsx` | Voice record button     | ✅ Done |
| `front-end/src/components/feed/PoseIndicator.tsx`      | Pose status icon        | ✅ Done |
| `front-end/src/hooks/useFeed.ts`                       | Feed data hook          | ✅ Done |
| `front-end/src/hooks/useComments.ts`                   | Comments hook           | ✅ Done |
| `front-end/src/hooks/useGoogleTTS.ts`                  | TTS hook                | ✅ Done |
| `front-end/src/hooks/usePoseDetection.ts`              | Pose detection hook     | ✅ Done |
| `front-end/src/hooks/useGestureControl.ts`             | Gesture → scroll action | ✅ Done |
| `backend/app/api/v1/feed.py`                           | Feed API                | ✅ Done |
| `backend/app/api/v1/tts.py`                            | TTS API                 | ✅ Done |
| `backend/app/api/v1/comments.py`                       | Comments API            | ✅ Done |

### Existing Patterns

- **API:** FastAPI with Pydantic validation
- **Frontend:** React Query for data fetching
- **Components:** Functional components with Tailwind CSS
- **Pose Detection:** MediaPipe in browser (see FEAT-003)

---

## 4. Implementation Plan

### Steps

- [x] Step 1: Setup feed API endpoint
- [x] Step 2: Create VoiceFeed component with snap scroll
- [x] Step 3: Create FeedItem with CuteFace
- [x] Step 4: Implement SpeechBubble component
- [x] Step 5: Add TTS integration (Google TTS)
- [x] Step 6: Create VoiceCommentButton
- [x] Step 7: Add CommentsList component
- [x] Step 8: Keyboard navigation (j/k, arrows)
- [x] Step 9: Create PoseIndicator component (small icon)
- [x] Step 10: Create useGestureControl hook (gesture → scroll)
- [x] Step 11: Integrate pose detection into VoiceFeed
- [x] Step 12: Add camera permission prompt
- [ ] Step 13: Polish animations và transitions

### Files to Change/Add

| File                                              | Change                                   |
|---------------------------------------------------|------------------------------------------|
| `front-end/src/components/feed/PoseIndicator.tsx` | **NEW** - Small icon showing pose status |
| `front-end/src/hooks/useGestureControl.ts`        | **NEW** - Map gestures to scroll actions |
| `front-end/src/components/feed/VoiceFeed.tsx`     | Integrate gesture control + indicator    |

---

## 5. Test Plan

### Test Cases

| ID    | Description           | Input               | Expected                   | Priority |
|-------|-----------------------|---------------------|----------------------------|----------|
| TC-01 | Load feed thành công  | Open app            | Feed items displayed       | High     |
| TC-02 | Scroll snap hoạt động | Scroll down         | Snaps to next item         | High     |
| TC-03 | TTS auto-play         | Item becomes active | Audio plays                | High     |
| TC-04 | Voice comment record  | Hold mic button     | Recording starts           | High     |
| TC-05 | Keyboard nav          | Press j/k           | Scroll to next/prev        | Low      |
| TC-06 | **Camera permission** | Allow camera        | Pose indicator shows green | High     |
| TC-07 | **Hand up gesture**   | Raise one hand      | Scroll to prev feed        | High     |
| TC-08 | **Hand down gesture** | Lower one hand      | Scroll to next feed        | High     |
| TC-09 | **Pose indicator**    | Camera active       | Green dot visible          | Medium   |

### Acceptance Criteria

- [x] Feed hiển thị dạng full-screen với snap scroll
- [x] CuteFace hiển thị với animation
- [x] TTS auto-play khi scroll tới item mới
- [x] Voice comment hoạt động
- [x] Comments hiển thị đúng
- [x] **Pose detection tự động bật khi camera allowed**
- [x] **Hand up → scroll up, Hand down → scroll down**
- [x] **Pose indicator icon hiển thị ở góc màn hình**

---

## 7. Implementation Summary

### What Changed

| File                                             | Change                                  |
|--------------------------------------------------|-----------------------------------------|
| `front-end/src/components/feed/VoiceFeed.tsx`    | Main feed với snap scroll, keyboard nav |
| `front-end/src/components/feed/FeedItem.tsx`     | Full-screen feed item với CuteFace, TTS |
| `front-end/src/components/feed/SpeechBubble.tsx` | Animated text bubble                    |
| `front-end/src/components/chat/CuteFace.tsx`     | Animated face component                 |
| `front-end/src/hooks/useFeed.ts`                 | React Query hook for feed               |
| `front-end/src/hooks/useGoogleTTS.ts`            | Google Cloud TTS integration            |
| `backend/app/api/v1/feed.py`                     | Feed REST API                           |
| `backend/app/api/v1/tts.py`                      | TTS proxy API                           |

### Key Decisions

| Decision                        | Reason                                  |
|---------------------------------|-----------------------------------------|
| Snap scroll                     | Better UX cho mobile-first              |
| Google Cloud TTS                | Chất lượng voice tốt, hỗ trợ tiếng Việt |
| Full-screen items               | Tập trung vào content như TikTok        |
| **Small pose indicator**        | Không làm distract khỏi main content    |
| **Auto-enable on camera allow** | Seamless UX, không cần thêm step        |

### Quick Reference

- Entry point: `front-end/src/App.tsx` → `VoiceFeed`
- Feed API: `GET /api/v1/feed`
- TTS API: `POST /api/v1/tts/synthesize`
- Comments API: `GET/POST /api/v1/comments`
- Pose hook: `usePoseDetection()` from FEAT-003

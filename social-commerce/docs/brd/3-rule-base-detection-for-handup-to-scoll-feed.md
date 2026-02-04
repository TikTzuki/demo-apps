# FEAT-003: Rule-Based Pose Detection for Feed Control

**Status:** DONE

> **Note:** Feature này được tích hợp vào FEAT-002 (Voice-First Social Feed). Cả core detection và integration đã hoàn
> thành.

---

## 1. Proposal

### Problem Statement

Người dùng muốn điều khiển feed bằng cử chỉ tay thay vì scroll thủ công. Ví dụ: giơ tay lên để chuyển feed tiếp theo.

### Proposed Solution

Sử dụng MediaPipe Pose để detect skeleton từ webcam, sau đó dùng rule-based logic để nhận dạng các gesture đơn giản
như "hands up", "hands down". Tích hợp vào VoiceFeed với minimal UI (small indicator icon).

### User Stories

- Là người dùng, tôi giơ 1 tay lên và feed tự động scroll lên
- Là người dùng, tôi giơ 1 tay xuống và feed tự động scroll xuống
- Là người dùng, tôi thấy icon nhỏ ở góc màn hình cho biết pose detection đang hoạt động

### Requirements

| ID        | Requirement                        | Priority | Status |
|-----------|------------------------------------|----------|--------|
| FR-003-01 | Detect 33 pose landmarks từ webcam | High     | ✅ Done |
| FR-003-02 | Rule-based gesture detection       | High     | ✅ Done |
| FR-003-03 | Real-time detection (< 100ms)      | High     | ✅ Done |
| FR-003-04 | Small pose indicator icon          | Medium   | ✅ Done |
| FR-003-05 | Integrate gesture → scroll action  | High     | ✅ Done |
| FR-003-06 | Camera permission flow             | Medium   | ✅ Done |

---

## 2. Wireframes

### Integration vào VoiceFeed

Xem wireframe chi tiết tại [FEAT-002: Voice-First Social Feed](./2-voice-first-social-feed.md#2-wireframes)

### Pose Indicator (góc trái trên)

```
┌────────────────────────────────────────┐
│  📷●                                   │  ← Small indicator
│     ↑                                  │
│     Green dot = detecting              │
│     Gray dot = paused                  │
│     Red X = permission denied          │
└────────────────────────────────────────┘
```

### Gesture Mapping

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Gesture              →  Action                        │
│  ─────────────────────────────────────────────────     │
│  left_hand_up         →  Scroll to PREVIOUS feed       │
│  right_hand_up        →  Scroll to PREVIOUS feed       │
│  hands_down           →  Scroll to NEXT feed           │
│  (neutral/other)      →  No action                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Code Analysis

### Core Detection (DONE)

| File                                             | Purpose                      | Status |
|--------------------------------------------------|------------------------------|--------|
| `backend/app/services/pose_detection.py`         | Rule-based gesture detection | ✅ Done |
| `backend/app/schemas/pose.py`                    | Pydantic schemas             | ✅ Done |
| `backend/app/api/v1/pose.py`                     | REST API endpoints           | ✅ Done |
| `front-end/src/types/pose.ts`                    | TypeScript types             | ✅ Done |
| `front-end/src/hooks/usePoseDetection.ts`        | MediaPipe hook               | ✅ Done |
| `front-end/src/components/pose/PoseDetector.tsx` | Standalone demo              | ✅ Done |
| `front-end/src/components/pose/PoseDemo.tsx`     | Demo page                    | ✅ Done |

### Integration với VoiceFeed (DONE)

| File                                              | Purpose                  | Status |
|---------------------------------------------------|--------------------------|--------|
| `front-end/src/components/feed/PoseIndicator.tsx` | Small status icon        | ✅ Done |
| `front-end/src/hooks/useGestureControl.ts`        | Gesture → scroll mapping | ✅ Done |
| `front-end/src/components/feed/VoiceFeed.tsx`     | Integrate pose control   | ✅ Done |

---

## 4. Implementation Plan

### Phase 1: Core Detection (DONE)

- [x] Step 1: Tạo pose detection service với rule-based logic
- [x] Step 2: Tạo Pydantic schemas cho API
- [x] Step 3: Tạo REST API endpoints
- [x] Step 4: Tạo TypeScript types
- [x] Step 5: Tạo usePoseDetection hook với MediaPipe
- [x] Step 6: Tạo PoseDetector component (standalone)
- [x] Step 7: Tạo PoseDemo page

### Phase 2: VoiceFeed Integration (DONE)

- [x] Step 8: Tạo PoseIndicator component (small icon)
- [x] Step 9: Tạo useGestureControl hook
- [x] Step 10: Integrate vào VoiceFeed.tsx
- [x] Step 11: Add camera permission prompt
- [x] Step 12: Add cooldown để tránh scroll quá nhanh

### Files to Add

| File                                              | Description                 |
|---------------------------------------------------|-----------------------------|
| `front-end/src/components/feed/PoseIndicator.tsx` | Icon 📷● ở góc trái         |
| `front-end/src/hooks/useGestureControl.ts`        | Map gesture → scrollToIndex |

---

## 5. Test Plan

### Test Cases

| ID    | Description            | Input                   | Expected                       | Priority |
|-------|------------------------|-------------------------|--------------------------------|----------|
| TC-01 | Detect hands up        | Raise both hands        | gesture = "hands_up"           | High     |
| TC-02 | Detect single hand up  | Raise one hand          | gesture = "left/right_hand_up" | High     |
| TC-03 | Detect hands down      | Lower both hands        | gesture = "hands_down"         | High     |
| TC-04 | Neutral pose           | Arms at sides           | gesture = "neutral"            | Medium   |
| TC-05 | **Hand up → scroll**   | Raise hand in VoiceFeed | Scroll to prev feed            | High     |
| TC-06 | **Hand down → scroll** | Lower hand in VoiceFeed | Scroll to next feed            | High     |
| TC-07 | **Pose indicator**     | Camera active           | Green dot visible              | Medium   |
| TC-08 | **Cooldown**           | Rapid gestures          | Only 1 scroll per 1s           | Medium   |

### Acceptance Criteria

- [x] MediaPipe loads và detect 33 landmarks
- [x] Rule-based detection cho gestures
- [x] Real-time display gesture label (demo)
- [x] **PoseIndicator hiển thị ở góc VoiceFeed**
- [x] **Hand up gesture → scroll up**
- [x] **Hand down gesture → scroll down**
- [x] **Cooldown 1 giây giữa các scroll**

---

## 7. Implementation Summary

### What Changed (Phase 1 - Core Detection)

| File                                             | Change                              |
|--------------------------------------------------|-------------------------------------|
| `backend/app/services/pose_detection.py`         | PoseGestureDetector class với rules |
| `backend/app/schemas/pose.py`                    | LandmarkSchema, GestureResponse     |
| `backend/app/api/v1/pose.py`                     | POST /detect, GET /gestures         |
| `front-end/src/types/pose.ts`                    | Gesture type, LANDMARK_INDEX        |
| `front-end/src/hooks/usePoseDetection.ts`        | MediaPipe + local detection         |
| `front-end/src/components/pose/PoseDetector.tsx` | Webcam + canvas overlay             |
| `front-end/src/components/pose/PoseDemo.tsx`     | Demo UI                             |
| `front-end/package.json`                         | @mediapipe/pose dependency          |

### Supported Gestures

| Gesture         | Detection Rule              | Feed Action |
|-----------------|-----------------------------|-------------|
| `left_hand_up`  | Left wrist above shoulder   | Scroll UP   |
| `right_hand_up` | Right wrist above shoulder  | Scroll UP   |
| `hands_up`      | Both wrists above shoulders | Scroll UP   |
| `hands_down`    | Both wrists below hips      | Scroll DOWN |
| `neutral`       | Default state               | No action   |

### Key Decisions

| Decision              | Reason                             |
|-----------------------|------------------------------------|
| MediaPipe in browser  | Real-time, no backend needed       |
| Rule-based detection  | Simple, no ML training             |
| Small indicator icon  | Minimal distraction                |
| 1s cooldown           | Prevent accidental rapid scrolling |
| Single hand detection | Easier for user than both hands    |

### What Changed (Phase 2 - VoiceFeed Integration)

| File                                              | Change                          |
|---------------------------------------------------|---------------------------------|
| `front-end/src/components/feed/PoseIndicator.tsx` | Small status icon (📷●/○/✕)     |
| `front-end/src/hooks/useGestureControl.ts`        | Gesture → scrollToIndex mapping |
| `front-end/src/components/feed/VoiceFeed.tsx`     | Integrated pose + gesture       |

### Quick Reference

- Frontend hook: `usePoseDetection()`
- Gesture hook: `useGestureControl()`
- Indicator: `<PoseIndicator />`
- Standalone demo: `<PoseDemo />`
- Dependencies: `@mediapipe/pose`

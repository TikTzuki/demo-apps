# FEAT-001: Hackathon Check-in Web

**Status:** ACTIVE

> **Status Guide:**
> - DRAFT: Đang planning/design
> - ACTIVE: Đang implement
> - PAUSED: Tạm dừng (xem Checkpoint bên dưới)
> - DONE: Hoàn thành
> - BLOCKED: Bị block bởi dependency

---

## 1. Proposal

### Problem Statement

Ứng dụng phục vụ check-in offline cho một buổi hackathon của công ty Newera.Inc. Hiện tại việc check-in thủ công bằng
giấy tờ mất thời gian và không chuyên nghiệp. Cần một giải pháp check-in nhanh, vui nhộn và phù hợp với không khí
hackathon.

### Proposed Solution

Tạo một trang web check-in với **Next.js + JSON file database** để hỗ trợ multi-device sync:

- **Tech Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database:** JSON file (đọc/ghi qua API routes) - đơn giản, dễ backup
- **Multi-device sync:** Tất cả thiết bị đọc/ghi cùng 1 JSON file qua API
- Giao diện cute face thân thiện, animation vui nhộn
- Hiển thị danh sách đội dưới dạng bong bóng lơ lửng
- Quy trình check-in đơn giản: Chọn đội → Chọn tên → Xác nhận
- **Hiển thị số người đã check-in theo thời gian thực**

### User Stories

- Là người tham gia, tôi đến cửa vào sự kiện và thấy QR check-in.
- Sử dụng điện thoại quét mã QR để mở trang web check-in.
- Trên trang web, tôi nhìn thấy danh sách đội tham gia trên các bong bóng lơ lửng vui nhộn.
- Tôi nhấn vào bong bóng đội của mình để thấy danh sách thành viên trong đội.
- Tôi click vào bong bóng tên mình để hoàn tất check-in.
- Tôi nhận được thông báo xác nhận check-in thành công trên nền animation vui nhộn và âm thanh chúc mừng.
- **Tôi có thể nhìn thấy số người đã check-in để biết sự kiện đang sôi động như thế nào.**

### Requirements

| ID        | Requirement                                             | Priority |
|-----------|---------------------------------------------------------|----------|
| FR-001-01 | Hiển thị danh sách đội dưới dạng bong bóng có animation | High     |
| FR-001-02 | Chọn đội để xem danh sách thành viên                    | High     |
| FR-001-03 | Chọn tên để check-in                                    | High     |
| FR-001-04 | Animation & âm thanh khi check-in thành công            | Medium   |
| FR-001-05 | **Multi-device sync qua JSON file + API**               | High     |
| FR-001-06 | Cute face animation trên header                         | Medium   |
| FR-001-07 | **Mobile-first responsive design (375px+)**             | High     |
| FR-001-08 | **Hiển thị số người đã check-in**                       | High     |
| FR-001-09 | **Cập nhật số lượng check-in realtime**                 | Medium   |
| FR-001-10 | **Click vào team trong Stats để xem danh sách member**  | High     |
| FR-001-11 | **Un-check-in member (sửa lỗi check-in nhầm)**          | High     |

### Alternatives Considered

| Option             | Pros                                   | Cons                             |
|--------------------|----------------------------------------|----------------------------------|
| Google Forms       | Miễn phí, dễ setup                     | Không có animation, cần internet |
| Eventbrite         | Professional, nhiều tính năng          | Phức tạp, tốn phí                |
| **Custom Web App** | Customize hoàn toàn, offline, vui nhộn | Cần develop                      |

---

## 2. Wireframes

### Screen: Trang chủ - Danh sách đội

```
┌─────────────────────────────────────────────────────────────────┐
│  ╭───────────────────────────────────────────────────────────╮  │
│  │                      🎉 HACKATHON 2026                    │  │
│  │                     NEWERA.INC CHECK-IN                   │  │
│  │                         (◕‿◕)                             │  │
│  ╰───────────────────────────────────────────────────────────╯  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │        🎯 Đã check-in: 45/120 người (37.5%)            │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ○ Team Alpha ○        ○ Team Beta ○        ○ Team Gamma ○   │
│         (4/5)                 (3/5)                (5/5)        │
│                                                                 │
│        ○ Team Delta ○      ○ Team Epsilon ○    ○ Team Zeta ○    │
│           (2/5)                (4/5)               (0/5)        │
│                                                                 │
│                      ○ Team Eta ○                               │
│                         (3/5)                                   │
│                                                                 │
│  [Bong bóng có animation float lên xuống]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components used:** Header, BubbleList, TeamBubble, CheckinCounter

### Screen: Danh sách thành viên

```
┌─────────────────────────────────────────────────────────────────┐
│  ╭───────────────────────────────────────────────────────────╮  │
│  │  ← Quay lại                    TEAM ALPHA                 │  │
│  │                                  (4/5)                    │  │
│  ╰───────────────────────────────────────────────────────────╯  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ○ Nguyễn Văn A ○     ○ Trần Thị B ○      ○ Lê Văn C ○      │
│          ✓                    ✓                   ✓             │
│                                                                 │
│        ○ Phạm Thị D ○         ○ Hoàng Văn E ○                  │
│             ✓                      [trống]                      │
│                                                                 │
│  [Thành viên đã check-in có màu xanh và dấu ✓]                 │
│  [Thành viên chưa check-in có màu trắng/xám]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components used:** Header, BackButton, MemberBubble, CheckedBadge

### Screen: Xác nhận check-in

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│              ╭─────────────────────────────╮                    │
│              │                             │                    │
│              │     Xác nhận check-in?      │                    │
│              │                             │                    │
│              │      Nguyễn Văn A           │                    │
│              │      Team Alpha             │                    │
│              │                             │                    │
│              │  ┌─────────┐  ┌─────────┐   │                    │
│              │  │   Hủy   │  │   OK    │   │                    │
│              │  └─────────┘  └─────────┘   │                    │
│              │                             │                    │
│              ╰─────────────────────────────╯                    │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components used:** Modal, Button

### Screen: Check-in thành công

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🎊 🎉 🎊 🎉 🎊 🎉 🎊                         │
│                                                                 │
│                         ✨✨✨                                  │
│                       (◕‿◕)  ♪                                 │
│                      CHECK-IN                                   │
│                    THÀNH CÔNG!                                  │
│                         ✨✨✨                                  │
│                                                                 │
│                    Chào mừng                                    │
│                  Nguyễn Văn A                                   │
│                    Team Alpha                                   │
│                                                                 │
│                 🎊 🎉 🎊 🎉 🎊 🎉 🎊                            │
│                                                                 │
│  [Confetti animation + Sound effect]                            │
│                                                                 │
│              ┌───────────────────────┐                          │
│              │    Về trang chủ       │                          │
│              └───────────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components used:** SuccessScreen, Confetti, CuteFace, Button

### Screen: Thống kê check-in - Mobile (375px)

```
┌───────────────────────────────┐
│     📊 THỐNG KÊ CHECK-IN      │
├───────────────────────────────┤
│                               │
│        🎯 45 / 120            │
│      NGƯỜI ĐÃ CHECK-IN        │
│                               │
│  ████████████░░░░░░░  37.5%   │
│                               │
├───────────────────────────────┤
│                               │
│  ┌─────────────────────────┐  │
│  │  Team Alpha      4/5  > │  │
│  │  ████░░░░░░░░░░░░░░░░░░ │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  Team Beta       3/5  > │  │
│  │  ███░░░░░░░░░░░░░░░░░░░ │  │
│  └─────────────────────────┘  │
│                               │
│  ┌─────────────────────────┐  │
│  │  Team Gamma    5/5  ✓ > │  │
│  │  █████████████████████  │  │
│  └─────────────────────────┘  │
│                               │
│  [Click vào team để xem       │
│   chi tiết và quản lý]        │
│                               │
└───────────────────────────────┘
```

**Components used:** StatsHeader, TotalCounter, ProgressBar, TeamProgressCard

### Screen: Chi tiết Team - Quản lý Check-in (Mobile)

```
┌───────────────────────────────┐
│  ← Quay lại    TEAM ALPHA     │
│                  4/5          │
├───────────────────────────────┤
│                               │
│  Đã check-in:                 │
│  ┌─────────────────────────┐  │
│  │ ✓ Nguyễn Văn A    [✕]   │  │
│  │   09:30 AM              │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ ✓ Trần Thị B      [✕]   │  │
│  │   09:35 AM              │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ ✓ Lê Văn C        [✕]   │  │
│  │   09:40 AM              │  │
│  └─────────────────────────┘  │
│  ┌─────────────────────────┐  │
│  │ ✓ Phạm Thị D      [✕]   │  │
│  │   09:45 AM              │  │
│  └─────────────────────────┘  │
│                               │
│  Chưa check-in:               │
│  ┌─────────────────────────┐  │
│  │ ○ Hoàng Văn E           │  │
│  └─────────────────────────┘  │
│                               │
│  [✕] = Nút hủy check-in       │
│                               │
└───────────────────────────────┘
```

**Components used:** TeamDetailHeader, MemberListItem, UncheckinButton

### Screen: Xác nhận hủy check-in (Modal)

```
┌───────────────────────────────┐
│                               │
│  ┌─────────────────────────┐  │
│  │                         │  │
│  │   ⚠️ Hủy check-in?      │  │
│  │                         │  │
│  │   Nguyễn Văn A          │  │
│  │   Team Alpha            │  │
│  │                         │  │
│  │   Bạn có chắc muốn hủy  │  │
│  │   check-in của thành    │  │
│  │   viên này?             │  │
│  │                         │  │
│  │  ┌───────┐  ┌────────┐  │  │
│  │  │ Không │  │  Hủy   │  │  │
│  │  └───────┘  └────────┘  │  │
│  │                         │  │
│  └─────────────────────────┘  │
│                               │
└───────────────────────────────┘
```

**Components used:** Modal, Button, WarningIcon

---

## 3. Code Analysis

> **Tech Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui**

### Project Structure (Next.js App Router)

```
checkin/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home - Team list
│   ├── team/[id]/page.tsx      # Team members (check-in)
│   ├── stats/
│   │   ├── page.tsx            # Stats overview
│   │   └── team/[id]/page.tsx  # Team detail (un-checkin)
│   ├── success/page.tsx        # Success screen
│   └── api/
│       ├── teams/
│       │   ├── route.ts        # GET all teams
│       │   └── [id]/route.ts   # GET team by id
│       ├── checkin/
│       │   ├── route.ts        # POST check-in
│       │   └── [memberId]/route.ts  # DELETE un-checkin
│       └── stats/route.ts      # GET stats
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── bubble/                 # Bubble components
│   ├── checkin/                # Check-in components
│   ├── stats/                  # Stats components
│   └── cute/                   # Cute face, confetti
├── lib/
│   ├── db.ts                   # JSON file read/write
│   ├── utils.ts                # Utilities
│   └── types.ts                # TypeScript types
├── hooks/                      # Custom hooks
├── public/
│   └── sounds/                 # Sound effects
├── data/
│   └── database.json           # JSON database file
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### Related Files

| File                 | Purpose                   | Impact             |
|----------------------|---------------------------|--------------------|
| `app/layout.tsx`     | Root layout với providers | Entry point        |
| `app/api/*`          | API routes đọc/ghi JSON   | Multi-device sync  |
| `lib/db.ts`          | Database utilities        | CRUD operations    |
| `data/database.json` | JSON database             | Data storage       |
| `components/ui/`     | shadcn components         | Base UI components |
| `database.json`      | Mock data storage         | Team & member data |

### Existing Patterns

- **State Management:** React Query (TanStack Query) cho server state, useState cho local state
- **Styling:** Tailwind CSS + shadcn/ui
- **Data Storage:** localStorage/IndexedDB cho offline
- **Animation:** Framer Motion hoặc CSS animations

### Reusable Code

- shadcn/ui Button, Dialog, Card components
- useLocalStorage hook từ hooks/
- Animation utilities từ lib/

### Dependencies & Conflicts

- Depends on: shadcn/ui setup, Tailwind CSS
- Conflicts: None

---

## 4. Implementation Plan

### Steps

- [ ] Step 1: Setup project structure (Vite + React + TypeScript + Tailwind)
- [ ] Step 2: Install shadcn/ui và setup base components
- [ ] Step 3: Tạo data model và mock data (teams, members)
- [ ] Step 4: Implement BubbleList component với animation
- [ ] Step 5: Implement TeamBubble component
- [ ] Step 6: Implement MemberBubble component
- [ ] Step 7: Implement check-in flow (modal confirm)
- [ ] Step 8: Implement success screen với confetti
- [ ] Step 9: Implement CuteFace animation component
- [ ] Step 10: Add sound effects
- [ ] Step 11: **Implement CheckinCounter component**
- [ ] Step 12: **Implement StatsPage cho admin view**
- [ ] Step 13: **Implement TeamDetailPage với danh sách member**
- [ ] Step 14: **Implement Un-checkin feature với confirm modal**
- [ ] Step 15: Implement offline storage (localStorage)
- [ ] Step 16: Testing & responsive fixes (mobile-first)
- [ ] Step 17: Deploy

### Files to Change

| File                                                  | Change                                      |
|-------------------------------------------------------|---------------------------------------------|
| `frontend/src/App.tsx`                                | Add routing, main layout                    |
| `frontend/src/components/bubble/TeamBubble.tsx`       | Team bubble với animation                   |
| `frontend/src/components/bubble/MemberBubble.tsx`     | Member bubble với checked state             |
| `frontend/src/components/bubble/BubbleList.tsx`       | Container với floating animation            |
| `frontend/src/components/checkin/ConfirmModal.tsx`    | Modal xác nhận check-in                     |
| `frontend/src/components/checkin/SuccessScreen.tsx`   | Màn hình thành công                         |
| `frontend/src/components/checkin/CheckinCounter.tsx`  | **Hiển thị số người đã check-in**           |
| `frontend/src/components/cute/CuteFace.tsx`           | Cute face animation                         |
| `frontend/src/components/effects/Confetti.tsx`        | Confetti effect                             |
| `frontend/src/pages/HomePage.tsx`                     | Trang chủ - danh sách đội                   |
| `frontend/src/pages/TeamPage.tsx`                     | Trang thành viên trong đội                  |
| `frontend/src/pages/StatsPage.tsx`                    | **Trang thống kê check-in**                 |
| `frontend/src/pages/TeamDetailPage.tsx`               | **Trang chi tiết team - quản lý check-in**  |
| `frontend/src/components/checkin/UncheckinButton.tsx` | **Nút hủy check-in với icon ✕**             |
| `frontend/src/components/checkin/UncheckinModal.tsx`  | **Modal xác nhận hủy check-in**             |
| `frontend/src/components/stats/MemberListItem.tsx`    | **Item member với trạng thái và thời gian** |
| `frontend/src/hooks/useCheckin.ts`                    | Hook quản lý check-in state                 |
| `frontend/src/hooks/useTeams.ts`                      | Hook lấy data teams                         |
| `frontend/src/hooks/useCheckinStats.ts`               | **Hook lấy thống kê check-in**              |
| `frontend/src/hooks/useUncheckin.ts`                  | **Hook xử lý hủy check-in**                 |
| `frontend/src/lib/storage.ts`                         | Offline storage utilities                   |
| `frontend/src/data/teams.ts`                          | Mock data teams & members                   |
| `frontend/src/types/checkin.ts`                       | TypeScript types                            |

### Database Changes

```typescript
// Không dùng database thực, dùng JSON file + localStorage

// database.json - Mock data
{
    "teams"
:
    [
        {
            "id": "team-1",
            "name": "Team Alpha",
            "color": "#FF6B6B",
            "members": [
                {"id": "member-1", "name": "Nguyễn Văn A", "checkedIn": false},
                {"id": "member-2", "name": "Trần Thị B", "checkedIn": false}
            ]
        }
    ],
        "checkins"
:
    [
        {
            "memberId": "member-1",
            "teamId": "team-1",
            "checkedInAt": "2024-01-15T09:30:00Z"
        }
    ],
        "stats"
:
    {
        "totalMembers"
    :
        120,
            "checkedIn"
    :
        45
    }
}
```

### API Changes

| Method | Endpoint               | Description                      |
|--------|------------------------|----------------------------------|
| GET    | /api/teams             | Lấy danh sách teams và members   |
| GET    | /api/teams/:id         | Lấy chi tiết team                |
| POST   | /api/checkin           | Check-in một member              |
| GET    | /api/stats             | **Lấy thống kê check-in**        |
| GET    | /api/stats/teams       | **Lấy thống kê theo từng team**  |
| GET    | /api/stats/teams/:id   | **Lấy chi tiết member của team** |
| DELETE | /api/checkin/:memberId | **Hủy check-in của member**      |

> Note: Vì là offline app, các API này sẽ được mock bằng localStorage

---

## 5. Test Plan

### Test Cases

| ID    | Description                          | Input                      | Expected                                        | Priority |
|-------|--------------------------------------|----------------------------|-------------------------------------------------|----------|
| TC-01 | Hiển thị danh sách teams             | Load trang                 | Thấy các bong bóng team với animation           | High     |
| TC-02 | Click vào team bubble                | Click Team Alpha           | Navigate đến trang thành viên Team Alpha        | High     |
| TC-03 | Hiển thị danh sách members           | Load trang team            | Thấy các bong bóng member, đã check-in có dấu ✓ | High     |
| TC-04 | Check-in member                      | Click member chưa check-in | Hiện modal xác nhận                             | High     |
| TC-05 | Xác nhận check-in                    | Click OK trên modal        | Hiện success screen, confetti, sound            | High     |
| TC-06 | Member đã check-in                   | Click member đã check-in   | Không cho check-in lại, hiện thông báo          | Medium   |
| TC-07 | Quay lại trang chủ                   | Click back button          | Navigate về trang teams                         | Medium   |
| TC-08 | Offline mode                         | Tắt internet, refresh      | App vẫn hoạt động với data cached               | High     |
| TC-09 | **Hiển thị counter**                 | Load trang                 | Thấy "Đã check-in: X/Y người"                   | High     |
| TC-10 | **Counter tự cập nhật**              | Check-in 1 người           | Counter tăng lên 1                              | High     |
| TC-11 | **Stats page**                       | Truy cập /stats            | Thấy thống kê chi tiết theo team                | Medium   |
| TC-12 | **Click vào team trong stats**       | Click Team Alpha           | Navigate đến trang chi tiết team                | High     |
| TC-13 | **Xem danh sách member đã check-in** | Load trang chi tiết team   | Thấy danh sách member với thời gian check-in    | High     |
| TC-14 | **Click nút hủy check-in**           | Click [✕] trên member      | Hiện modal xác nhận hủy                         | High     |
| TC-15 | **Xác nhận hủy check-in**            | Click "Hủy" trên modal     | Member chuyển về trạng thái chưa check-in       | High     |
| TC-16 | **Hủy bỏ việc un-checkin**           | Click "Không" trên modal   | Modal đóng, không thay đổi gì                   | Medium   |
| TC-17 | Responsive mobile 375px              | Mở trên iPhone SE          | Layout hiển thị đẹp, không bị tràn              | High     |
| TC-18 | Responsive mobile 390px              | Mở trên iPhone 14          | Layout hiển thị đẹp, tối ưu space               | High     |

### Acceptance Criteria

- [ ] Tất cả teams hiển thị dạng bong bóng với animation float
- [ ] Check-in flow hoạt động: chọn team → chọn member → xác nhận → success
- [ ] Confetti và sound effect khi check-in thành công
- [ ] Cute face animation trên header
- [ ] Data được lưu offline, không mất khi refresh
- [ ] **Số người đã check-in hiển thị chính xác**
- [ ] **Counter tự động cập nhật khi có người check-in mới**
- [ ] **Click vào team trong Stats mở trang chi tiết**
- [ ] **Danh sách member hiển thị trạng thái và thời gian check-in**
- [ ] **Nút hủy check-in [✕] hoạt động với confirm modal**
- [ ] **Un-checkin cập nhật lại counter và trạng thái member**
- [ ] Mobile-first responsive (375px - iPhone SE trở lên)
- [ ] Text hiển thị tiếng Việt, có dấu đầy đủ

---

## 6. Checkpoint

> **Fill khi Status = PAUSED**

**Paused at:** YYYY-MM-DD
**Reason:** [User request / New requirements / Blocker]
**Last step:** Step X

### Completed

- [ ] Step 1 - Setup project

### In Progress

- [ ] Step 2 - **Partial:** [What's done]

### Remaining

- [ ] Step 3+

### New/Changed Requirements

- [NEW] [New requirement]
- [MODIFIED] [Changed requirement]

---

## 7. Implementation Summary

> **Fill khi Status = DONE** (để AI sessions sau đọc nhanh)

### What Changed

| File               | Change                    |
|--------------------|---------------------------|
| `src/path/file.ts` | [What was added/modified] |

### Key Decisions

| Decision                             | Reason                            |
|--------------------------------------|-----------------------------------|
| Dùng localStorage thay vì backend    | App offline, không cần server     |
| CSS animations thay vì Framer Motion | Đơn giản, nhẹ, đủ dùng            |
| JSON file cho mock data              | Dễ edit, không cần setup database |

### Patterns Used

- **Compound Components:** BubbleList + TeamBubble
- **Custom Hooks:** useCheckin, useTeams, useCheckinStats
- **Optimistic Updates:** Update UI ngay khi check-in

### Quick Reference

- Entry point: `frontend/src/main.tsx`
- Config: `frontend/src/data/teams.ts`
- Routes:
    - `/` - Trang chủ danh sách đội
    - `/team/:id` - Trang thành viên trong đội (check-in)
    - `/stats` - Trang thống kê check-in
    - `/stats/team/:id` - Chi tiết team (quản lý un-checkin)
    - `/success` - Màn hình check-in thành công
- Storage key: `hackathon-checkin-data`
- Breakpoints: 375px (mobile), 640px (sm), 768px (md)

---

## Appendix A: Data Schema

### Team

```typescript
interface Team {
    id: string;
    name: string;
    color: string; // Hex color cho bubble
    members: Member[];
}
```

### Member

```typescript
interface Member {
    id: string;
    name: string;
    teamId: string;
    checkedIn: boolean;
    checkedInAt?: string; // ISO date string
}
```

### CheckinStats

```typescript
interface CheckinStats {
    totalMembers: number;
    checkedIn: number;
    percentage: number;
    teamStats: TeamStats[];
}

interface TeamStats {
    teamId: string;
    teamName: string;
    totalMembers: number;
    checkedIn: number;
    isComplete: boolean; // true nếu tất cả đã check-in
}
```

### CheckinRecord (cho un-checkin feature)

```typescript
interface CheckinRecord {
    memberId: string;
    teamId: string;
    memberName: string;
    teamName: string;
    checkedInAt: string; // ISO date string - hiển thị thời gian
    checkedInBy?: string; // Optional: ai đã check-in (nếu cần audit)
}

interface UncheckinRequest {
    memberId: string;
    teamId: string;
    reason?: string; // Optional: lý do hủy check-in
}
```

---

## Appendix B: Animation Specs

### Bubble Float Animation

```css
@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
}

.bubble {
    animation: float 3s ease-in-out infinite;
    animation-delay: var(--delay); /* Random delay cho mỗi bubble */
}
```

### Cute Face Animation

```css
@keyframes blink {
    0%, 45%, 55%, 100% {
        transform: scaleY(1);
    }
    50% {
        transform: scaleY(0.1);
    }
}

.eye {
    animation: blink 4s ease-in-out infinite;
}
```

### Confetti Animation

- Sử dụng canvas-confetti library
- Duration: 3 giây
- Colors: Rainbow
- Particles: 200

---

## Appendix C: Sound Effects

| Event            | Sound             | Duration |
|------------------|-------------------|----------|
| Check-in success | Celebration chime | 1.5s     |
| Bubble click     | Soft pop          | 0.2s     |
| Error            | Subtle buzz       | 0.3s     |

> Lưu sound files tại `frontend/public/sounds/`

---

## Appendix D: Mobile-First Design Specs

### Breakpoints

| Breakpoint   | Width  | Target Devices          |
|--------------|--------|-------------------------|
| xs (default) | 375px+ | iPhone SE, small phones |
| sm           | 640px+ | Large phones landscape  |
| md           | 768px+ | Tablets                 |

### Touch Targets

- Minimum touch target: 44x44px (Apple HIG)
- Bubble size on mobile: min 80px diameter
- Button padding: min 12px vertical, 16px horizontal
- Spacing between interactive elements: min 8px

### Mobile Layout Guidelines

```
┌─────────────────────────────────┐
│ Safe area top (notch)           │
├─────────────────────────────────┤
│ Header (fixed, 56px)            │
├─────────────────────────────────┤
│                                 │
│ Content (scrollable)            │
│ - Padding: 16px horizontal      │
│ - Gap: 12px between items       │
│                                 │
├─────────────────────────────────┤
│ Safe area bottom (home bar)     │
└─────────────────────────────────┘
```

### Typography Scale (Mobile)

| Element       | Size | Weight |
|---------------|------|--------|
| Title         | 20px | 700    |
| Subtitle      | 16px | 600    |
| Body          | 14px | 400    |
| Caption       | 12px | 400    |
| Counter (big) | 32px | 700    |

### Color Palette

| Name           | Hex     | Usage             |
|----------------|---------|-------------------|
| Primary        | #6366F1 | Buttons, links    |
| Success        | #22C55E | Check-in done     |
| Warning        | #F59E0B | Un-checkin button |
| Danger         | #EF4444 | Confirm delete    |
| Background     | #F8FAFC | Page background   |
| Surface        | #FFFFFF | Cards, bubbles    |
| Text Primary   | #1E293B | Main text         |
| Text Secondary | #64748B | Captions, time    |

---

## Appendix E: Un-checkin Flow

### Flow Diagram

```
┌─────────────────┐
│  Stats Page     │
│  (Danh sách     │
│   team cards)   │
└────────┬────────┘
         │ Click team card
         ▼
┌─────────────────┐
│ Team Detail     │
│ - Checked list  │
│ - Unchecked list│
└────────┬────────┘
         │ Click [✕] icon
         ▼
┌─────────────────┐
│ Confirm Modal   │
│ "Hủy check-in?" │
│ [Không] [Hủy]   │
└────────┬────────┘
         │ Click "Hủy"
         ▼
┌─────────────────┐
│ Update Storage  │
│ - checkedIn=false│
│ - remove time   │
│ - update stats  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UI Updated      │
│ - Member moves  │
│   to unchecked  │
│ - Counter -1    │
└─────────────────┘
```

### Un-checkin Rules

1. Chỉ admin/staff mới có quyền un-checkin (nếu cần phân quyền)
2. Hiển thị modal xác nhận trước khi un-checkin
3. Sau khi un-checkin, member có thể check-in lại bình thường
4. Lưu log un-checkin (optional) để audit
5. Counter và progress bar tự động cập nhật

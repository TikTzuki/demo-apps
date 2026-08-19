# Architectural Decisions

This file logs architectural decisions (ADRs) with context and trade-offs.

## Format

Each decision should include:

- Date and ADR number
- Context (why the decision was needed)
- Decision (what was chosen)
- Alternatives considered
- Consequences (trade-offs, implications)

---

<!-- Add new decision entries below this line -->

---

## ADR: Chấm công theo phiên và cách tính OT

**Ngày:** 2026-08-19
**Trạng thái:** Đã áp dụng

### Bối cảnh

Ứng dụng ban đầu phục vụ check-in một lần cho sự kiện hackathon: `Member.checkedIn`
là một cờ boolean kèm một mốc `checkedInAt`. Nghiệp vụ mới là chấm công hằng ngày,
trong đó một người có thể vào/ra nhiều lần trong cùng một ngày công — đặc biệt là
ca đêm (về lúc 18:30 rồi quay lại lúc 22:00).

### Quyết định

1. **Thay boolean bằng bản ghi phiên.** `AttendanceSession` lưu từng cặp
   check-in/check-out. Trạng thái "đang có mặt" được suy ra từ phiên chưa đóng,
   không lưu trữ riêng.

2. **OT tính theo giờ đồng hồ, không theo tổng giờ làm.** Mọi phút làm sau
   `otStartTime` (mặc định 18:00) đều là OT. Vì vậy ca 08:00–22:00 cho đúng 4h OT
   như nghiệp vụ mô tả. Cách tính theo "vượt quá 8h" sẽ cho 5h và không khớp.

3. **Ngày công (`workDate`) tính theo mốc cắt 05:00.** Phiên bắt đầu 22:00 ngày
   19/08 và kết thúc 02:00 ngày 20/08 vẫn thuộc ngày công 19/08. Giá trị được lưu
   sẵn trên từng phiên để truy vấn và xuất Excel chỉ là điều kiện `WHERE`.

4. **Múi giờ cố định theo cấu hình, không theo `TZ` của máy chủ.** Việt Nam không
   có DST nên `timezoneOffsetMinutes = 420` là chính xác tuyệt đối. Giao diện cũng
   hiển thị giờ theo offset này (không dùng giờ trình duyệt), để giờ hiển thị luôn
   khớp với số phút hệ thống đã tính.

5. **Không bao giờ tự suy ra giờ check-out.** Phiên bỏ ngỏ quá `maxSessionHours`
   bị đánh dấu `MISSING_CHECKOUT` để quản trị viên sửa tay (kèm lý do bắt buộc).
   Nhân viên vẫn được check-in ca mới — chặn họ làm việc cả ngày còn tệ hơn một
   bản ghi bị gắn cờ.

### Hệ quả

- Toàn bộ quy tắc nằm trong hàm thuần `src/lib/attendance/compute.ts`, nhận
  `(sessions, policy, now)` — không chạm Prisma, không đọc đồng hồ — nên kiểm thử
  được đầy đủ (`compute.test.ts`).
- Đổi cấu hình trong `/admin/settings` sẽ tính lại cả dữ liệu quá khứ, vì số phút
  được suy ra chứ không lưu sẵn. Đây là chủ ý: sửa sai cấu hình sẽ tự động đúng lại.

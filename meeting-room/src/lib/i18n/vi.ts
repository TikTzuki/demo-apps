import type {Translations} from "./index";

export const vi: Translations = {
    // Home page
    "home.title": "Phòng họp",
    "home.subtitle": "Chọn văn phòng để đặt lịch họp",
    "home.newOrg": "Văn phòng mới",
    "home.empty": "Chưa có văn phòng nào",

    // Org detail page
    "org.back": "Quay lại",
    "org.rooms": "Phòng",
    "org.subtitle": "Chọn phòng để đặt lịch họp",
    "org.newRoom": "Phòng mới",
    "org.empty": "Chưa có phòng nào",
    "org.deleteConfirm": 'Xoá "{{name}}"?',
    "org.roomCount": "{{count}} phòng",
    "org.roomCountPlural": "{{count}} phòng",

    // Room detail page
    "room.back": "Quay lại",
    "room.title": "Đặt phòng họp",
    "room.subtitle": "Chọn ngày, chọn khung giờ và đặt phòng họp",
    "room.available": "Còn trống",
    "room.occupied": "Đang sử dụng",
    "room.bookedBy": "Đặt bởi {{name}}",
    "room.left": "Còn {{duration}}",
    "room.deleteConfirm": 'Xoá "{{name}}" và tất cả lịch đặt của phòng này?',

    // Booking form
    "booking.name": "Tên của bạn",
    "booking.namePlaceholder": "VD: Minh",
    "booking.selectTime": "Chọn giờ",
    "booking.tapDrag": "Chạm hoặc kéo để chọn giờ",
    "booking.bookRoom": "Đặt phòng họp",
    "booking.booking": "Đang đặt...",
    "booking.today": "Hôm nay",

    // Booking confirmation
    "booking.booked": "Đặt phòng họp thành công!",
    "booking.reserved": "Phòng của bạn đã được đặt.",
    "booking.room": "Phòng",
    "booking.organization": "Văn phòng",
    "booking.nameLabel": "Tên",
    "booking.time": "Thời gian",
    "booking.duration": "Thời lượng",
    "booking.done": "Xong",

    // Cancel booking
    "booking.cancelTitle": "Huỷ đặt phòng",
    "booking.cancelConfirm": "Bạn có chắc muốn huỷ lịch đặt này?",
    "booking.typeToConfirm": 'Nhập "{{name}}" để xác nhận',
    "booking.keep": "Giữ lại",
    "booking.cancelling": "Đang huỷ...",
    "booking.cancelBooking": "Huỷ đặt phòng",

    // Admin
    "admin.active": "Quản trị viên",
    "admin.activeMsg":
        "Bạn có quyền quản trị. Bạn có thể tạo và xoá văn phòng và phòng.",
    "admin.logout": "Đăng xuất",
    "admin.title": "Truy cập quản trị",
    "admin.enterSecret": "Nhập mã bí mật để quản lý văn phòng và phòng.",
    "admin.placeholder": "Nhập mã bí mật",
    "admin.invalid": "Mã bí mật không họp lệ",
    "admin.verifying": "Đang xác minh...",
    "admin.unlock": "Mở khoá",

    // Create org
    "admin.newOrg": "Tạo văn phòng",
    "admin.orgName": "Tên văn phòng",
    "admin.orgDesc": "Mô tả (không bắt buộc)",
    "admin.creating": "Đang tạo...",
    "admin.createOrg": "Tạo văn phòng",
    "admin.createFailed": "Không thể tạo văn phòng",
    "admin.orgTag": "tag (VD: myorg4)",

    // Create room
    "admin.newRoom": "Tạo phòng",
    "admin.roomName": "Tên phòng",
    "admin.capacity": "Sức chứa",
    "admin.location": "Vị trí (không bắt buộc)",
    "admin.createRoom": "Tạo phòng",
    "admin.creatingRoom": "Đang tạo...",
    "admin.createRoomFailed": "Không thể tạo phòng",

    // Calendar
    "calendar.months": [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
    ],
    "calendar.days": ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],

    // Theme
    "theme.label": "Giao diện",

    // Discord
    "discord.addToDiscord": "Thêm vào Discord",
    "discord.guideTitle": "Thông báo Discord",
    "discord.guideStep1": "1. Bấm nút bên dưới để mời bot vào server",
    "discord.guideStep2": "2. Trong kênh bất kỳ, gõ:",
    "discord.guideStep3": "3. Bot sẽ gửi thông báo đặt phòng vào kênh đó",
    "discord.guideUnlink": "Để ngừng thông báo, gõ:",
    "discord.addBot": "Thêm Bot vào Server",

    // Telegram
    "telegram.addToTelegram": "Thêm vào Telegram",
    "telegram.guideTitle": "Thông báo Telegram",
    "telegram.guideStep1": "1. Bấm nút bên dưới để thêm bot vào nhóm",
    "telegram.guideStep2": "2. Trong nhóm, gõ:",
    "telegram.guideStep3": "3. Bot sẽ gửi thông báo đặt phòng vào nhóm đó",
    "telegram.guideUnlink": "Để ngừng thông báo, gõ:",
    "telegram.addBot": "Thêm Bot vào Nhóm",

    // Booking errors
    "booking.createFailed": "Không thể tạo lịch đặt",
    "booking.cancelFailed": "Không thể huỷ lịch đặt",
};


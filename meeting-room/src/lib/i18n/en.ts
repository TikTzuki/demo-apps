export const en = {
    // Home page
    "home.title": "Meeting Rooms",
    "home.subtitle": "Select an organization to book a room",
    "home.newOrg": "New Organization",
    "home.empty": "No organizations yet",

    // Org detail page
    "org.back": "Back",
    "org.rooms": "Rooms",
    "org.subtitle": "Select a room to book",
    "org.newRoom": "New Room",
    "org.empty": "No rooms yet",
    "org.deleteConfirm": 'Delete "{{name}}" and all its rooms?',
    "org.roomCount": "{{count}} room",
    "org.roomCountPlural": "{{count}} rooms",

    // Room detail page
    "room.back": "Back",
    "room.title": "Book Room",
    "room.subtitle": "Pick a date, select a time range, and book",
    "room.available": "Available",
    "room.occupied": "Occupied",
    "room.bookedBy": "Booked by {{name}}",
    "room.left": "{{duration}} left",
    "room.deleteConfirm": 'Delete "{{name}}" and all its bookings?',

    // Booking form
    "booking.name": "Your Name",
    "booking.namePlaceholder": "e.g. John",
    "booking.selectTime": "Select Time",
    "booking.tapDrag": "Tap or drag to pick a time",
    "booking.bookRoom": "Book Room",
    "booking.booking": "Booking...",
    "booking.today": "Today",

    // Booking confirmation
    "booking.booked": "Booked!",
    "booking.reserved": "Your room is reserved.",
    "booking.room": "Room",
    "booking.organization": "Organization",
    "booking.nameLabel": "Name",
    "booking.time": "Time",
    "booking.duration": "Duration",
    "booking.done": "Done",

    // Cancel booking
    "booking.cancelTitle": "Cancel Booking",
    "booking.cancelConfirm": "Are you sure you want to cancel this booking?",
    "booking.typeToConfirm": 'Type "{{name}}" to confirm',
    "booking.keep": "Keep",
    "booking.cancelling": "Cancelling...",
    "booking.cancelBooking": "Cancel Booking",

    // Admin
    "admin.active": "Admin Active",
    "admin.activeMsg":
        "You have admin access. You can create and delete organizations and rooms.",
    "admin.logout": "Log Out",
    "admin.title": "Admin Access",
    "admin.enterSecret":
        "Enter the admin secret to manage organizations and rooms.",
    "admin.placeholder": "Enter admin secret",
    "admin.invalid": "Invalid secret",
    "admin.verifying": "Verifying...",
    "admin.unlock": "Unlock",

    // Create org
    "admin.newOrg": "New Organization",
    "admin.orgName": "Organization name",
    "admin.orgDesc": "Description (optional)",
    "admin.creating": "Creating...",
    "admin.createOrg": "Create Organization",
    "admin.createFailed": "Failed to create organization",

    // Create room
    "admin.newRoom": "New Room",
    "admin.roomName": "Room name",
    "admin.capacity": "Capacity",
    "admin.location": "Location (optional)",
    "admin.createRoom": "Create Room",
    "admin.creatingRoom": "Creating...",
    "admin.createRoomFailed": "Failed to create room",

    // Calendar
    "calendar.months": [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ],
    "calendar.days": ["M", "T", "W", "T", "F", "S", "S"],

    // Theme
    "theme.label": "Theme",

    // Booking errors
    "booking.createFailed": "Failed to create booking",
    "booking.cancelFailed": "Failed to cancel booking",
} as const;

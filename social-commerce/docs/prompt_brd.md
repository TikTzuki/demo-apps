  ---                                                                                                                                                            
FEAT-001: Profile and Authentication

Prompt:                                                                                                                                                        
Viết BRD cho hệ thống authentication của ứng dụng social commerce cho người Việt Nam.

Yêu cầu:

- Đăng ký bằng số điện thoại Việt Nam (10 số, bắt đầu 0)
- Mật khẩu là PIN 6 chữ số (dễ nhập trên mobile)
- Đăng nhập bằng phone + PIN
- Sử dụng JWT token cho session management
- Profile page đơn giản với thông tin user và đăng xuất

Tech stack:

- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React + TypeScript + React Query

Bao gồm wireframes cho màn hình đăng ký, đăng nhập, và profile (dạng ASCII
art).                                                                               
Phân tích alternatives (OTP vs Password thông thường vs PIN) và giải thích tại sao chọn PIN.
                                                                                                                                                                 
---                                                                                                                                                            
FEAT-002: Voice-First Social Feed

Prompt:                                                                                                                                                        
Viết BRD cho tính năng Voice-First Social Feed theo phong cách TikTok/Shorts cho ứng dụng social commerce.

Yêu cầu chính:

- Full-screen feed với snap scroll (như TikTok)
- CuteFace avatar animation cho mỗi feed item
- Auto-play TTS khi feed item active (tiếng Việt với Google Cloud TTS)
- Speech bubble hiển thị text đang được đọc
- Voice comment: giữ nút microphone để ghi âm và comment bằng giọng nói
- Comments list cho mỗi feed
- Keyboard navigation (j/k, arrows)

Gesture control (tích hợp với pose detection):

- Tự động bật pose detection khi user cho phép camera
- Giơ 1 tay lên (trái hoặc phải) → scroll lên feed trước
- Giơ 1 tay xuống → scroll xuống feed tiếp theo
- Hiển thị indicator icon nhỏ ở góc màn hình cho biết trạng thái pose detection (📷●/○/✕)

Bao gồm wireframes và flow cho camera permission popup.
                                                                                                                                                                 
---                                                                                                                                                            
FEAT-003: Rule-Based Pose Detection for Feed Control

Prompt:                                                                                                                                                        
Viết BRD cho tính năng pose detection để điều khiển feed bằng cử chỉ tay.

Yêu cầu:

- Sử dụng MediaPipe Pose để detect skeleton từ webcam (33 landmarks)
- Rule-based logic (không cần ML training) để nhận dạng gestures:
    - left_hand_up: cổ tay trái cao hơn vai → scroll UP
    - right_hand_up: cổ tay phải cao hơn vai → scroll UP
    - hands_up: cả hai cổ tay cao hơn vai → scroll UP
    - hands_down: cả hai cổ tay thấp hơn hông → scroll DOWN
    - neutral: trạng thái bình thường
- Real-time detection (< 100ms latency)
- Tích hợp vào VoiceFeed với minimal UI (small indicator icon)
- Cooldown 1 giây giữa các scroll để tránh scroll quá nhanh

Chia thành 2 phase:

- Phase 1: Core Detection (standalone demo)
- Phase 2: VoiceFeed Integration

BRD này là phần technical của FEAT-002, tập trung vào pose detection logic.
                                                                                                                                                                 
---                                                                                                                                                            
FEAT-004: Store & Product Chatbot

Prompt:                                                                                                                                                        
Viết BRD cho tính năng Store & Product Chatbot trong ứng dụng social commerce.

Yêu cầu business:

- User có thể đăng ký làm store (isStore=true flag)
- Store users hiển thị icon 🏪 bên cạnh nickname trên feed
- Mỗi store có product catalog với: id, image, name, price, unit, quantity
- Khi user comment bằng giọng nói trên feed của store, chatbot tự động trả lời

Flow xử lý voice comment:

1. STT: chuyển voice → text (tiếng Việt, vi-VN)
2. Intent Detection: phân tích intent từ text bằng Vietnamese keywords
3. Product Matching: fuzzy search tên sản phẩm (hỗ trợ có dấu và không dấu)
4. Chatbot Response: generate câu trả lời phù hợp
5. TTS: đọc câu trả lời bằng tiếng Việt

Intent detection với Vietnamese keywords:

- ASK_PRICE: "bao nhiêu", "giá", "mấy tiền", "mấy đồng"
- ASK_QUANTITY: "còn hàng", "còn không", "hết chưa", "còn bao nhiêu"
- ASK_AVAILABLE: "có không", "có bán không"

Product matching:

- Fuzzy search với unidecode (bỏ dấu) + Levenshtein distance
- Ví dụ: "sau rieng" → match "Sầu riêng Ri6"

Mock data:

- Sử dụng mock data trái cây miền Tây cho demo (xoài, sầu riêng, măng cụt, chôm chôm)
- Không cần database, lưu in-memory

Bao gồm wireframes cho feed với store badge và chatbot response flow
diagram.                                                                                  
Liệt kê các Vietnamese NLP test cases.
                                                                                                                                                                 
---                                                                                                                                                            
BRD Template/Format Prompt

If you want to generate BRDs in the same format, add this meta-prompt:

Format BRD theo template sau:

1. **Proposal**: Problem Statement, Proposed Solution, User Stories, Requirements table, Alternatives Considered
2. **Wireframes**: ASCII art diagrams cho các màn hình chính
3. **Code Analysis**: Related Files table, Existing Patterns, Reusable Code, Dependencies
4. **Implementation Plan**: Steps (checkbox), Files to Change table, Database/API Changes
5. **Test Plan**: Test Cases table, Acceptance Criteria (checkbox)
6. **Checkpoint**: (fill khi Status = PAUSED)
7. **Implementation Summary**: (fill khi Status = DONE)

Ngôn ngữ: Tiếng Việt cho content, English cho code/technical
terms.                                                                                            
Status: DRAFT | ACTIVE | PAUSED | DONE | BLOCKED 
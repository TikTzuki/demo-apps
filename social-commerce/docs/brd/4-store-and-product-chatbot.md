# FEAT-004: Store & Product Chatbot

**Status:** DRAFT

---

## 1. Proposal

### Problem Statement

Ứng dụng cần hỗ trợ người bán hàng (store owner) có thể đăng sản phẩm và trả lời tự động các câu hỏi về sản phẩm từ
người dùng. Khi người dùng comment bằng giọng nói hỏi về giá hoặc số lượng sản phẩm, chatbot sẽ tự động trả lời bằng
tiếng Việt.

### Proposed Solution

1. **Store Flag:** User có flag `isStore=true` sẽ được hiển thị icon cửa hàng bên cạnh nickname
2. **Product Catalog:** Mỗi store có danh sách sản phẩm với thông tin: id, image, name, price, quantity
3. **Voice Comment Processing:** Khi comment bằng giọng nói trên feed của store:
    - STT chuyển voice → text (tiếng Việt)
    - NLP phân tích intent (hỏi giá, hỏi số lượng, hỏi có hàng không)
    - Chatbot trả lời tự động nếu match với sản phẩm trong catalog

### User Stories

- Là một người bán hàng, tôi muốn đăng ký tài khoản store để bán sản phẩm
- Là một người bán hàng, tôi muốn thêm sản phẩm với hình ảnh, tên, giá và số lượng
- Là một người mua hàng, tôi thấy icon 🏪 bên cạnh tên store trên feed
- Là một người mua hàng, tôi hỏi bằng giọng nói "Cái này bao nhiêu tiền?" và được chatbot trả lời tự động
- Là một người mua hàng, tôi hỏi "Còn hàng không?" và chatbot trả lời số lượng tồn kho

### Requirements

| ID        | Requirement                                          | Priority |
|-----------|------------------------------------------------------|----------|
| FR-004-01 | User có flag `isStore: boolean` (default false)      | High     |
| FR-004-02 | Store icon (🏪) hiển thị bên cạnh nickname của store | High     |
| FR-004-03 | Product model: id, image, name, price, quantity      | High     |
| FR-004-04 | API CRUD products cho store owner                    | High     |
| FR-004-05 | Vietnamese STT cho voice comment                     | High     |
| FR-004-06 | Intent detection cho câu hỏi về sản phẩm             | High     |
| FR-004-07 | Chatbot auto-reply với thông tin sản phẩm            | High     |
| FR-004-08 | TTS đọc câu trả lời của chatbot (tiếng Việt)         | Medium   |
| FR-004-09 | Fuzzy matching tên sản phẩm (tiếng Việt có dấu)      | Medium   |
| FR-004-10 | Mock data cho demo (không cần database)              | High     |

### Vietnamese Language Processing

| Aspect           | Approach                                                   |
|------------------|------------------------------------------------------------|
| STT              | Web Speech API (vi-VN) hoặc Google Speech-to-Text          |
| Intent Detection | Rule-based với keywords tiếng Việt                         |
| Product Matching | Fuzzy search với unidecode (bỏ dấu) + Levenshtein distance |
| TTS Response     | Google Cloud TTS (vi-VN) - đã có sẵn                       |

### Intent Keywords (Vietnamese)

| Intent        | Keywords                                                         |
|---------------|------------------------------------------------------------------|
| ASK_PRICE     | "bao nhiêu", "giá", "mấy tiền", "mấy đồng", "giá bao nhiêu"      |
| ASK_QUANTITY  | "còn hàng", "còn không", "hết chưa", "còn bao nhiêu", "số lượng" |
| ASK_AVAILABLE | "có không", "có bán không", "còn cái này không"                  |

---

## 2. Wireframes

### Feed với Store Badge

```
┌─────────────────────────────────────────────────────────────────┐
│  📷●                                              🔊  ⚙️        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         ┌─────────┐                             │
│                         │  😊     │                             │
│                         └─────────┘                             │
│                                                                 │
│              ┌───────────────────────────────┐                  │
│              │  "Xin chào! Hôm nay shop có   │                  │
│              │   trái cây tươi ngon nè..."   │                  │
│              └───────────────────────────────┘                  │
│                                                                 │
│   🏪 @shop_trai_cay_mien_tay                    ← Store badge   │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   💬 Comments (3)                                               │
│   ├── 🤖 Bot: "Dạ, xoài Cát Hòa Lộc 45.000đ/kg ạ!"              │
│   ├── User1: "Còn hàng không shop?"                             │
│   └── 🤖 Bot: "Dạ còn 50kg ạ!"                                  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🎤  Giữ để hỏi về sản phẩm                             │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Chatbot Response Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   User Voice Comment                                             │
│   ─────────────────                                              │
│   🎤 "Xoài bao nhiêu tiền vậy shop?"                             │
│                                                                  │
│            ↓                                                     │
│                                                                  │
│   STT Processing (vi-VN)                                         │
│   ──────────────────────                                         │
│   Text: "xoài bao nhiêu tiền vậy shop"                           │
│                                                                  │
│            ↓                                                     │
│                                                                  │
│   Intent Detection                                               │
│   ────────────────                                               │
│   Intent: ASK_PRICE                                              │
│   Product keyword: "xoài"                                        │
│                                                                  │
│            ↓                                                     │
│                                                                  │
│   Product Matching (Fuzzy)                                       │
│   ────────────────────────                                       │
│   Match: "Xoài Cát Hòa Lộc" (score: 0.85)                        │
│   Price: 45000                                                   │
│   Quantity: 50                                                   │
│                                                                  │
│            ↓                                                     │
│                                                                  │
│   Chatbot Response                                               │
│   ────────────────                                               │
│   🤖 "Dạ, Xoài Cát Hòa Lộc giá 45.000đ/kg ạ!"                    │
│                                                                  │
│            ↓                                                     │
│                                                                  │
│   TTS (vi-VN)                                                    │
│   ───────────                                                    │
│   🔊 [Audio plays response]                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Store Product Management (Future - Out of Scope)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back               Sản phẩm của tôi              + Thêm      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────┐  Xoài Cát Hòa Lộc                                    │
│   │ 🥭  │  45.000đ/kg                                           │
│   └──────┘  Còn: 50kg                               ✏️  🗑️     │
│                                                                 │
│   ┌──────┐  Sầu riêng Ri6                                       │
│   │ 🍈  │  120.000đ/kg                                          │
│   └──────┘  Còn: 20kg                               ✏️  🗑️     │
│                                                                 │
│   ┌──────┐  Măng cụt                                            │
│   │ 🍇  │  35.000đ/kg                                           │
│   └──────┘  Còn: 30kg                               ✏️  🗑️     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Note: UI quản lý sản phẩm nằm ngoài scope MVP.
MVP sẽ dùng mock data.
```

---

## 3. Code Analysis

### Data Models

#### User (extend from FEAT-001)

```python
class User(BaseModel):
    id: int                          # Long ID
    phone: str
    nickname: str                    # @username format
    is_store: bool = False           # Store flag
    store_name: str | None = None    # Tên cửa hàng (nếu isStore=true)
```

#### Product

```python
class Product(BaseModel):
    id: int                          # Long ID
    store_id: int                    # Owner user ID
    image: str                       # URL to product image
    name: str                        # Tên sản phẩm (tiếng Việt)
    name_normalized: str             # Tên không dấu (for search)
    price: int                       # Giá (VND)
    unit: str = "cái"                # Đơn vị: kg, cái, hộp, etc.
    quantity: int                    # Số lượng tồn kho
```

#### ChatIntent

```python
class ChatIntent(str, Enum):
    ASK_PRICE = "ask_price"
    ASK_QUANTITY = "ask_quantity"
    ASK_AVAILABLE = "ask_available"
    UNKNOWN = "unknown"
```

### Related Files

| File                                             | Purpose                    | Status |
|--------------------------------------------------|----------------------------|--------|
| `backend/app/schemas/user.py`                    | User schema với isStore    | 🔲 New |
| `backend/app/schemas/product.py`                 | Product schema             | 🔲 New |
| `backend/app/schemas/chatbot.py`                 | Intent, ChatRequest/Resp   | 🔲 New |
| `backend/app/api/v1/products.py`                 | Product CRUD API           | 🔲 New |
| `backend/app/api/v1/chatbot.py`                  | Chatbot API                | 🔲 New |
| `backend/app/services/intent_detector.py`        | Vietnamese intent detect   | 🔲 New |
| `backend/app/services/product_matcher.py`        | Fuzzy product search       | 🔲 New |
| `backend/app/services/chatbot.py`                | Chatbot response generator | 🔲 New |
| `front-end/src/components/feed/StoreBadge.tsx`   | Store icon component       | 🔲 New |
| `front-end/src/components/feed/ChatbotReply.tsx` | Bot reply in comments      | 🔲 New |
| `front-end/src/hooks/useChatbot.ts`              | Chatbot interaction hook   | 🔲 New |
| `front-end/src/types/product.ts`                 | Product types              | 🔲 New |
| `front-end/src/types/chatbot.ts`                 | Chatbot types              | 🔲 New |

### Existing Code to Modify

| File                                         | Change                              |
|----------------------------------------------|-------------------------------------|
| `backend/app/schemas/feed.py`                | Add `is_store`, `store_id` fields   |
| `backend/app/api/v1/feed.py`                 | Include store info in feed response |
| `front-end/src/components/feed/FeedItem.tsx` | Show StoreBadge for store users     |
| `front-end/src/hooks/useComments.ts`         | Handle chatbot auto-reply           |

---

## 4. Implementation Plan

### Phase 1: Store Badge (MVP)

- [ ] Step 1: Extend FeedItem schema với `is_store`, `store_id` fields
- [ ] Step 2: Create StoreBadge component (🏪 icon)
- [ ] Step 3: Update FeedItem to show StoreBadge
- [ ] Step 4: Add mock store data to feed.py

### Phase 2: Product Catalog (MVP)

- [ ] Step 5: Create Product schema
- [ ] Step 6: Create mock products data (trái cây miền Tây)
- [ ] Step 7: Create products API (GET /api/v1/products/{store_id})

### Phase 3: Vietnamese Intent Detection (MVP)

- [ ] Step 8: Create IntentDetector service với Vietnamese keywords
- [ ] Step 9: Create ProductMatcher service với fuzzy search
- [ ] Step 10: Unit tests cho intent detection

### Phase 4: Chatbot Integration (MVP)

- [ ] Step 11: Create Chatbot service (combine intent + product + response)
- [ ] Step 12: Create chatbot API endpoint (POST /api/v1/chatbot/ask)
- [ ] Step 13: Create useChatbot hook
- [ ] Step 14: Integrate chatbot vào VoiceCommentButton flow
- [ ] Step 15: Auto-insert bot reply vào comments list
- [ ] Step 16: TTS đọc bot reply

### Files to Add

| File                                           | Description                           |
|------------------------------------------------|---------------------------------------|
| `backend/app/schemas/product.py`               | Product Pydantic schema               |
| `backend/app/schemas/chatbot.py`               | ChatIntent, ChatRequest, ChatResponse |
| `backend/app/api/v1/products.py`               | GET products by store_id              |
| `backend/app/api/v1/chatbot.py`                | POST /ask endpoint                    |
| `backend/app/services/intent_detector.py`      | Vietnamese keyword-based intent       |
| `backend/app/services/product_matcher.py`      | Fuzzy search với unidecode            |
| `backend/app/services/chatbot.py`              | Response generation                   |
| `front-end/src/components/feed/StoreBadge.tsx` | 🏪 icon component                     |
| `front-end/src/hooks/useChatbot.ts`            | Chatbot interaction                   |
| `front-end/src/types/product.ts`               | Product TypeScript types              |
| `front-end/src/types/chatbot.ts`               | Chatbot TypeScript types              |

### API Changes

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | /api/v1/products/{store_id} | Lấy danh sách sản phẩm của store     |
| POST   | /api/v1/chatbot/ask         | Gửi câu hỏi, nhận trả lời từ chatbot |

### Mock Data (Trái cây miền Tây)

```python
MOCK_PRODUCTS = [
    Product(
        id=1,
        store_id=101,
        image="/images/xoai.jpg",
        name="Xoài Cát Hòa Lộc",
        name_normalized="xoai cat hoa loc",
        price=45000,
        unit="kg",
        quantity=50
    ),
    Product(
        id=2,
        store_id=101,
        image="/images/sau-rieng.jpg",
        name="Sầu riêng Ri6",
        name_normalized="sau rieng ri6",
        price=120000,
        unit="kg",
        quantity=20
    ),
    Product(
        id=3,
        store_id=101,
        image="/images/mang-cut.jpg",
        name="Măng cụt",
        name_normalized="mang cut",
        price=35000,
        unit="kg",
        quantity=30
    ),
    Product(
        id=4,
        store_id=101,
        image="/images/chom-chom.jpg",
        name="Chôm chôm",
        name_normalized="chom chom",
        price=25000,
        unit="kg",
        quantity=40
    ),
]
```

---

## 5. Test Plan

### Test Cases

| ID    | Description                | Input                     | Expected                          | Priority |
|-------|----------------------------|---------------------------|-----------------------------------|----------|
| TC-01 | Store badge hiển thị       | Feed với isStore=true     | 🏪 icon visible                   | High     |
| TC-02 | Store badge không hiển thị | Feed với isStore=false    | No 🏪 icon                        | High     |
| TC-03 | Detect intent ASK_PRICE    | "Xoài bao nhiêu tiền?"    | intent=ASK_PRICE, keyword="xoài"  | High     |
| TC-04 | Detect intent ASK_QUANTITY | "Còn hàng không shop?"    | intent=ASK_QUANTITY               | High     |
| TC-05 | Fuzzy match có dấu         | "Sầu riêng"               | Match "Sầu riêng Ri6"             | High     |
| TC-06 | Fuzzy match không dấu      | "sau rieng"               | Match "Sầu riêng Ri6"             | High     |
| TC-07 | Chatbot trả lời giá        | "Măng cụt giá bao nhiêu?" | "Dạ, Măng cụt giá 35.000đ/kg ạ!"  | High     |
| TC-08 | Chatbot trả lời số lượng   | "Chôm chôm còn không?"    | "Dạ còn 40kg ạ!"                  | High     |
| TC-09 | Product không tồn tại      | "Có bưởi không?"          | "Dạ shop chưa có sản phẩm này ạ!" | Medium   |
| TC-10 | TTS đọc chatbot reply      | Bot reply generated       | Audio plays in Vietnamese         | Medium   |

### Vietnamese NLP Test Cases

| ID     | Input (Voice → Text)            | Expected Intent | Expected Product    |
|--------|---------------------------------|-----------------|---------------------|
| NLP-01 | "cái này bao nhiêu tiền vậy"    | ASK_PRICE       | (context from feed) |
| NLP-02 | "xoài giá mấy đồng"             | ASK_PRICE       | "Xoài Cát Hòa Lộc"  |
| NLP-03 | "shop còn sầu riêng không"      | ASK_AVAILABLE   | "Sầu riêng Ri6"     |
| NLP-04 | "măng cụt còn bao nhiêu kg"     | ASK_QUANTITY    | "Măng cụt"          |
| NLP-05 | "cho hỏi giá chôm chôm với"     | ASK_PRICE       | "Chôm chôm"         |
| NLP-06 | "tui muốn mua xoai" (không dấu) | ASK_AVAILABLE   | "Xoài Cát Hòa Lộc"  |

### Acceptance Criteria

- [ ] Store users có 🏪 icon bên cạnh nickname
- [ ] Voice comment được chuyển thành text (tiếng Việt)
- [ ] Intent detection hoạt động với các câu hỏi về giá/số lượng
- [ ] Fuzzy matching tìm được sản phẩm kể cả khi user nói không dấu
- [ ] Chatbot auto-reply với thông tin chính xác từ product catalog
- [ ] TTS đọc câu trả lời của chatbot

---

## 6. Checkpoint

> **Fill khi Status = PAUSED**

---

## 7. Implementation Summary

> **Fill khi Status = DONE**

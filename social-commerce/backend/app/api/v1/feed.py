from fastapi import APIRouter

from app.schemas.feed import FeedItem, FeedResponse

router = APIRouter()

MOCK_FEED_DATA: list[FeedItem] = [
    FeedItem(
        id="101",
        title="Sáng cà phê chưa bà con ơi ☕",
        mood="happy",
        background_color="#f1c40f",
        greeting="Sáng ra làm ly cà phê, ngồi ngẫm chuyện đời thấy cũng vui ha.",
        creator="@chu_nam_saigon",
    ),
    FeedItem(
        id="102",
        title="Bữa nay thấy trong người khoái khoái 😄",
        mood="excited",
        background_color="#ff7675",
        greeting="Không biết có chuyện gì, mà tự nhiên thấy đời nhẹ tênh à!",
        creator="@co_ut_mien_tay",
    ),
    FeedItem(
        id="103",
        title="Ủa chứ thiệt hông ta? 🤔",
        mood="curious",
        background_color="#55efc4",
        greeting="Nghe người ta nói vậy mà tui còn bán tín bán nghi à nghen.",
        creator="@chu_bay_bentre",
    ),
    FeedItem(
        id="104",
        title="Trời đất ơi, mới hay luôn đó 😮",
        mood="surprised",
        background_color="#fab1a0",
        greeting="Sống tới giờ mà giờ mới biết, đúng là đời còn nhiều cái lạ!",
        creator="@co_sau_cantho",
    ),
    FeedItem(
        id="105",
        title="Chiều mát, lòng cũng mát theo 🌤️",
        mood="happy",
        background_color="#ffeaa7",
        greeting="Chiều ngồi trước hiên, gió thổi nhẹ, thấy bình yên ghê.",
        creator="@chu_tu_quan9",
    ),
    FeedItem(
        id="106",
        title="Nghe nói dạo này đổi khác dữ lắm 😄",
        mood="excited",
        background_color="#fd79a8",
        greeting="Mấy bữa nay thiên hạ bàn tán xôm tụ, tò mò ghê!",
        creator="@co_bay_saigon",
    ),
    FeedItem(
        id="107",
        title="Cho tui hỏi ké cái nè 🧐",
        mood="curious",
        background_color="#74b9ff",
        greeting="Tui thắc mắc lâu rồi mà chưa có dịp hỏi nè.",
        creator="@chu_nam_longan",
    ),
    FeedItem(
        id="108",
        title="Thiệt tình là không ngờ luôn á 😲",
        mood="surprised",
        background_color="#e17055",
        greeting="Tưởng chuyện nhỏ, ai dè nghe xong muốn đứng hình luôn!",
        creator="@co_chin_tiengiang",
    ),
]


@router.get("", response_model=FeedResponse)
async def get_feed() -> FeedResponse:
    """Lấy danh sách feed với dữ liệu giả lập."""
    return FeedResponse(success=True, data=MOCK_FEED_DATA)

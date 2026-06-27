import json
import logging
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from app.config import settings

logger = logging.getLogger(__name__)

API_URL = (settings.ANTHROPIC_API_BASE_URL or "https://api.anthropic.com").rstrip("/")
MODEL = settings.ANTHROPIC_MODEL
print("Using Anthropic API URL:", API_URL)
print("Using Anthropic model:", MODEL)


def _call_messages(system: str, user_content: str, max_tokens: int = 2048) -> str:
    """Call the Anthropic Messages API via raw HTTP and return the text response."""
    payload = json.dumps({
        "model": MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user_content}],
    }).encode("utf-8")
    req = Request(
        url=f"{API_URL}/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "cv-hub/1.0",
            "Accept": "application/json",
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )

    try:
        with urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        logger.error("Anthropic API error %s: %s", e.code, error_body)
        raise RuntimeError(f"Anthropic API returned {e.code}: {error_body}") from e

    # Extract text from first content block
    for block in body.get("content", []):
        if block.get("type") == "text":
            return block["text"].strip()

    raise RuntimeError("No text block in Anthropic API response")


def _parse_json_response(text: str) -> dict:
    """Strip markdown code fences if present and parse JSON."""
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return json.loads(text)


def review_cv(cv_text: str, note: str = "") -> dict:
    """Use Claude to perform a comprehensive review of a CV."""
    system_prompt = (
        "Bạn là một chuyên gia tuyển dụng kỹ thuật cấp cao và cố vấn nghề nghiệp với hơn 15 năm "
        "kinh nghiệm đánh giá CV và hồ sơ xin việc trong ngành công nghệ. Đánh giá của bạn "
        "phải kỹ lưỡng, mang tính xây dựng và có thể hành động được. Bạn đánh giá CV dựa trên "
        "sự rõ ràng, mức độ liên quan, lượng hóa tác động, chiều sâu kỹ thuật, chất lượng "
        "trình bày và tổng thể. Luôn trả lời bằng tiếng Việt."
    )

    note_section = ""
    if note.strip():
        note_section = f"""
## Ghi chú từ người đánh giá
{note.strip()}

Hãy đặc biệt chú ý đến các yêu cầu và ghi chú trên khi đánh giá CV.
"""

    user_prompt = f"""Hãy đánh giá CV/hồ sơ xin việc sau đây và đưa ra đánh giá có cấu trúc.

## Nội dung CV
```
{cv_text}
```
{note_section}
Bạn PHẢI trả lời bằng JSON hợp lệ (không có markdown code fences, không có text thừa). Sử dụng đúng schema sau:

{{
  "review_text": "<Đánh giá chi tiết định dạng markdown bao gồm: 1) Ấn tượng tổng thể, 2) Đánh giá cấu trúc và trình bày, 3) Chất lượng và mức độ liên quan của nội dung, 4) Trình bày kỹ năng kỹ thuật, 5) Mô tả kinh nghiệm và lượng hóa tác động, 6) Học vấn và chứng chỉ, 7) Các khuyến nghị cụ thể để cải thiện>",
  "strengths": ["<điểm mạnh 1>", "<điểm mạnh 2>", "..."],
  "weaknesses": ["<điểm yếu 1>", "<điểm yếu 2>", "..."],
  "overall_score": <số từ 1 đến 10, trong đó 1 là rất kém và 10 là xuất sắc>
}}

Hướng dẫn:
- QUAN TRỌNG: Giữ câu trả lời NGẮN GỌN. Tổng JSON không quá 2000 ký tự.
- review_text nên dài 150-250 từ, viết bằng markdown, bằng tiếng Việt. Chỉ nêu ý chính, không lan man.
- Mỗi điểm mạnh/yếu chỉ 1 câu ngắn (dưới 20 từ).
- Liệt kê 3-5 điểm mạnh và 3-5 điểm yếu.
- Cụ thể và tham chiếu nội dung thực tế từ CV.
- overall_score phải phản ánh chất lượng CV một cách toàn diện.
- Nếu nội dung CV trống hoặc không đọc được, vẫn trả về JSON hợp lệ ghi chú vấn đề."""

    response_text = _call_messages(system_prompt, user_prompt, max_tokens=4096)
    result = _parse_json_response(response_text)

    return {
        "review_text": str(result.get("review_text", "")),
        "strengths": [str(s) for s in result.get("strengths", [])],
        "weaknesses": [str(w) for w in result.get("weaknesses", [])],
        "overall_score": float(result.get("overall_score", 5)),
    }


def match_cv_jd(
        cv_text: str,
        jd_title: str,
        jd_description: str,
        jd_requirements: str,
) -> dict:
    """Use Claude to evaluate how well a CV matches a job description."""
    system_prompt = (
        "Bạn là một chuyên gia tuyển dụng nhân tài và phân tích ATS (Hệ thống theo dõi ứng viên). "
        "Bạn đánh giá chính xác mức độ phù hợp của CV ứng viên với mô tả công việc cụ thể. "
        "Phân tích của bạn dựa trên dữ liệu, công bằng và kỹ lưỡng, xem xét cả kỹ năng cứng "
        "và kỹ năng mềm, mức độ kinh nghiệm và tiềm năng. Luôn trả lời bằng tiếng Việt."
    )

    user_prompt = f"""Phân tích mức độ phù hợp của CV sau với mô tả công việc đã cho.

## Mô tả công việc
**Vị trí:** {jd_title}

**Mô tả:**
{jd_description}

**Yêu cầu:**
{jd_requirements}

## Nội dung CV
```
{cv_text}
```

Bạn PHẢI trả lời bằng JSON hợp lệ (không có markdown code fences, không có text thừa). Sử dụng đúng schema sau:

{{
  "match_percentage": <số từ 0 đến 100>,
  "match_details": "<Tóm tắt tổng thể mức độ phù hợp và khuyến nghị, bằng tiếng Việt>",
  "matched_items": [
    {{"requirement": "<yêu cầu từ JD>", "status": "matched", "evidence": "<bằng chứng cụ thể từ CV>"}},
    {{"requirement": "<yêu cầu từ JD>", "status": "partial", "evidence": "<giải thích phù hợp một phần>"}},
    {{"requirement": "<yêu cầu từ JD>", "status": "missing", "evidence": "<không tìm thấy trong CV>"}}
  ]
}}

Hướng dẫn:
- Tách từng yêu cầu trong mô tả công việc thành các mục riêng biệt trong matched_items.
- status chỉ có 3 giá trị: "matched" (đáp ứng), "partial" (đáp ứng một phần), "missing" (thiếu).
- evidence phải cụ thể, tham chiếu nội dung thực tế từ CV.
- Liệt kê TẤT CẢ yêu cầu từ JD, kể cả kỹ năng, kinh nghiệm, học vấn, kỹ năng mềm.
- Chính xác với match_percentage. Xem xét: phù hợp kỹ năng (~40%), liên quan kinh nghiệm (~30%), phù hợp học vấn (~15%), và trình bày tổng thể (~15%).
- match_details nên dài 100-200 từ, viết bằng tiếng Việt.
- Nếu nội dung CV trống hoặc không đọc được, gán match_percentage thấp và giải thích lý do."""

    response_text = _call_messages(system_prompt, user_prompt, max_tokens=4096)
    result = _parse_json_response(response_text)

    return {
        "match_percentage": float(result.get("match_percentage", 0)),
        "match_details": str(result.get("match_details", "")),
        "matched_items": result.get("matched_items", []),
    }

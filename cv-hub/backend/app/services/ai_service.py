import json
import anthropic

from app.config import settings

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(
            base_url=settings.ANTHROPIC_API_BASE_URL,
            api_key=settings.ANTHROPIC_API_KEY
        )
    return _client


MODEL = "claude-sonnet-4-6"


def review_cv(cv_text: str) -> dict:
    """Use Claude to perform a comprehensive review of a CV.

    Args:
        cv_text: The full extracted text of the CV.

    Returns:
        A dict with keys:
            - review_text (str): Detailed markdown review.
            - strengths (list[str]): Key strengths identified.
            - weaknesses (list[str]): Key weaknesses / areas for improvement.
            - overall_score (float): Score from 1 to 10.
    """
    client = _get_client()

    system_prompt = (
        "You are a senior technical recruiter and career advisor with 15+ years of "
        "experience reviewing CVs and resumes across the technology industry. Your "
        "reviews are thorough, constructive, and actionable. You evaluate CVs based "
        "on clarity, relevance, impact quantification, technical depth, formatting "
        "quality, and overall presentation."
    )

    user_prompt = f"""Please review the following CV/resume and provide a structured evaluation.

## CV Content
```
{cv_text}
```

You MUST respond with valid JSON only (no markdown code fences, no extra text). Use this exact schema:

{{
  "review_text": "<A detailed markdown-formatted review covering: 1) Overall impression, 2) Structure and formatting assessment, 3) Content quality and relevance, 4) Technical skills presentation, 5) Experience descriptions and impact quantification, 6) Education and certifications, 7) Specific actionable recommendations for improvement>",
  "strengths": ["<strength 1>", "<strength 2>", "..."],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "..."],
  "overall_score": <number from 1 to 10, where 1 is very poor and 10 is exceptional>
}}

Guidelines:
- The review_text should be 300-500 words, written in markdown.
- List 3-6 strengths and 3-6 weaknesses.
- Be specific and reference actual content from the CV.
- The overall_score should reflect the CV quality holistically.
- If the CV text is empty or unreadable, still provide a valid JSON response noting the issue."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": user_prompt}],
        system=system_prompt,
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code fences if the model wraps the JSON
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        response_text = "\n".join(lines)

    result = json.loads(response_text)

    # Validate and coerce types
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
    """Use Claude to evaluate how well a CV matches a job description.

    Args:
        cv_text: The full extracted text of the CV.
        jd_title: Title of the job description.
        jd_description: Full description of the role.
        jd_requirements: Requirements for the role.

    Returns:
        A dict with keys:
            - match_percentage (float): 0-100 indicating match quality.
            - match_details (str): Markdown explanation of the match analysis.
    """
    client = _get_client()

    system_prompt = (
        "You are an expert talent acquisition specialist and ATS (Applicant Tracking "
        "System) analyst. You precisely evaluate how well a candidate's CV aligns with "
        "a specific job description. Your analysis is data-driven, fair, and thorough, "
        "considering both hard skills and soft skills, experience level, and potential."
    )

    user_prompt = f"""Analyze how well the following CV matches the given job description.

## Job Description
**Title:** {jd_title}

**Description:**
{jd_description}

**Requirements:**
{jd_requirements}

## CV Content
```
{cv_text}
```

You MUST respond with valid JSON only (no markdown code fences, no extra text). Use this exact schema:

{{
  "match_percentage": <number from 0 to 100>,
  "match_details": "<A detailed markdown-formatted analysis covering: 1) Overall match summary, 2) Skills alignment — which required skills the candidate has vs. lacks, 3) Experience level fit, 4) Key qualifications met, 5) Notable gaps, 6) Recommendation (strong match / moderate match / weak match) with justification>"
}}

Guidelines:
- Be precise with the match_percentage. Consider: skills match (~40%), experience relevance (~30%), education fit (~15%), and overall presentation (~15%).
- The match_details should be 200-400 words, written in markdown.
- Reference specific items from both the CV and the JD.
- If the CV text is empty or unreadable, assign a low match percentage and explain why."""

    message = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": user_prompt}],
        system=system_prompt,
    )

    response_text = message.content[0].text.strip()

    # Strip markdown code fences if the model wraps the JSON
    if response_text.startswith("```"):
        lines = response_text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        response_text = "\n".join(lines)

    result = json.loads(response_text)

    return {
        "match_percentage": float(result.get("match_percentage", 0)),
        "match_details": str(result.get("match_details", "")),
    }

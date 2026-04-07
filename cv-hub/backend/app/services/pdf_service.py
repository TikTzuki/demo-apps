import pdfplumber
from pathlib import Path


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text content from a PDF file using pdfplumber.

    Args:
        file_path: Absolute or relative path to the PDF file.

    Returns:
        Concatenated text from all pages, separated by newlines.

    Raises:
        FileNotFoundError: If the PDF file does not exist.
        Exception: If pdfplumber fails to read the file.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")

    text_parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    return "\n\n".join(text_parts).replace("\x00", "")

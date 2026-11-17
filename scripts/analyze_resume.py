#!/usr/bin/env python3
"""Extract a bounded, non-identifying list of technical skills from a resume file."""
import argparse
import json
from pathlib import Path

try:
    import pdfplumber
except Exception:
    pdfplumber = None

try:
    import docx
except Exception:
    docx = None

SKILLS = [
    "python", "java", "javascript", "typescript", "react", "next.js", "next", "node", "express",
    "django", "flask", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes",
    "aws", "gcp", "azure", "git", "html", "css", "rest", "graphql", "c++", "c#", "go",
]
MAX_EXTRACTED_CHARS = 200_000


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        if pdfplumber is None:
            raise RuntimeError("pdf parser unavailable")
        with pdfplumber.open(str(path)) as pdf:
            return "\n".join((page.extract_text() or "") for page in pdf.pages)[:MAX_EXTRACTED_CHARS]
    if suffix == ".docx":
        if docx is None:
            raise RuntimeError("document parser unavailable")
        return "\n".join(paragraph.text for paragraph in docx.Document(str(path)).paragraphs)[:MAX_EXTRACTED_CHARS]
    if suffix == ".txt":
        return path.read_text(encoding="utf-8", errors="replace")[:MAX_EXTRACTED_CHARS]
    raise RuntimeError("unsupported file type")


def find_skills(text: str):
    normalized = text.lower()
    return [skill for skill in SKILLS if skill in normalized]


def main():
    parser = argparse.ArgumentParser(description="Extract resume technical skills")
    parser.add_argument("resume", help="Path to a TXT, PDF, or DOCX resume")
    args = parser.parse_args()
    path = Path(args.resume)

    try:
        if not path.is_file():
            raise RuntimeError("file unavailable")
        result = {"skills": find_skills(extract_text(path))}
    except Exception:
        # Keep failures non-identifying: paths and extracted text must never reach stdout.
        result = {"error": "extract_failed"}

    print(json.dumps(result, separators=(",", ":")))


if __name__ == "__main__":
    main()

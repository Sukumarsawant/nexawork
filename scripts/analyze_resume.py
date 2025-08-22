#!/usr/bin/env python3
"""
Simple resume analyzer CLI.
Supports PDF and DOCX. Extracts text, emails, phone numbers, and heuristics for name and skills.
Outputs JSON to stdout.
"""
import sys
import json
import re
from pathlib import Path
import argparse

try:
    import pdfplumber
except Exception:
    pdfplumber = None

try:
    import docx
except Exception:
    docx = None

try:
    import phonenumbers
except Exception:
    phonenumbers = None

SKILLS = [
    "python", "java", "javascript", "typescript", "react", "next.js", "next", "node", "express",
    "django", "flask", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes",
    "aws", "gcp", "azure", "git", "html", "css", "rest", "graphql", "c++", "c#", "go",
]
# isme u can add skills agar tuzhe chaiye extraa

EMAIL_RE = re.compile(r"[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+")

# bas pdf hai thode time ke lie 
def extract_text(path: Path) -> str:
    text = ""
    if path.suffix.lower() == ".pdf":
        if pdfplumber is None:
            raise RuntimeError("pdfplumber not installed. See requirements.txt")
        with pdfplumber.open(str(path)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
    elif path.suffix.lower() in (".docx", ".doc"):
        if docx is None:
            raise RuntimeError("python-docx not installed. See requirements.txt")
        doc = docx.Document(str(path))
        for p in doc.paragraphs:
            text += p.text + "\n"
    else:
        # fallback to reading as text
        text = path.read_text(encoding="utf-8", errors="ignore")
    return text


def find_emails(text: str):
    return list(set(EMAIL_RE.findall(text)))


def find_phones(text: str):
    if phonenumbers is None:
        # fallback simple regex for international and local-ish numbers
        phone_re = re.compile(r"(\+?\d[\d\-() \.]{6,}\d)")
        matches = phone_re.findall(text)
        return list(set([m.strip() for m in matches]))
    phones = set()
    for match in phonenumbers.PhoneNumberMatcher(text, None):
        phones.add(phonenumbers.format_number(match.number, phonenumbers.PhoneNumberFormat.E164))
    return list(phones)


def guess_name(text: str):
    # Heuristic: first non-empty line that looks like a name (2-3 words, Title Case)
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        # reject lines that contain @ or digits (likely email or phone or address)
        if "@" in s or any(ch.isdigit() for ch in s):
            continue
        parts = s.split()
        if 1 < len(parts) <= 4 and all(p[0].isupper() for p in parts if p):
            # looks like a name
            return s
    return None


def find_skills(text: str):
    t = text.lower()
    found = [s for s in SKILLS if s in t]
    return found


def analyze(path_str: str):
    path = Path(path_str)
    if not path.exists():
        print(json.dumps({"error": "file_not_found", "path": path_str}))
        return
    try:
        text = extract_text(path)
    except Exception as e:
        print(json.dumps({"error": "extract_failed", "reason": str(e)}))
        return

    result = {
        "path": str(path),
        "text_snippet": (text[:200] + "...") if len(text) > 200 else text,
        "emails": find_emails(text),
        "phones": find_phones(text),
        "name_guess": guess_name(text),
        "skills": find_skills(text),
    }
    return result


def compute_ats(resume_text: str, job_description: str):
    jd = (job_description or "").lower()

    # Role -> skills mapping for short job-title inputs
    ROLE_MAP = {
        "sde": ["data structures", "algorithms", "java", "python", "c++", "git"],
        "software engineer": ["data structures", "algorithms", "java", "python", "git"],
        "backend": ["node", "express", "java", "python", "sql", "docker"],
        "frontend": ["javascript", "react", "html", "css", "typescript"],
        "fullstack": ["javascript", "react", "node", "sql", "docker"],
        "devops": ["docker", "kubernetes", "aws", "gcp", "ci/cd"],
        "data": ["python", "sql", "pandas", "numpy", "machine learning"],
    }

    required = [s for s in SKILLS if s in jd]

    jd_words = jd.split()
    for role, skills in ROLE_MAP.items():
        if role in jd or (len(jd_words) <= 3 and role in jd):
            for sk in skills:
                if sk not in required:
                    required.append(sk)

    detected = [s.lower() for s in find_skills(resume_text)]
    found = [r for r in required if any(r == d or r in d or d in r for d in detected)]
    missing = [r for r in required if r not in found]

    if required:
        score = round((len(found) / len(required)) * 100)
    else:
        # fallback: base score on number of detected skills
        if len(detected) >= 4:
            score = 100
        else:
            score = min(90, len(detected) * 25)

    suggestions = []
    if missing:
        suggestions = [f"Consider adding or highlighting '{m}' on your resume" for m in missing]
    else:
        suggestions = ["Good match — consider adding quantifiable achievements to strengthen the resume."]

    return {
        "ats_score": score,
        "required_skills": required,
        "found_skills": found,
        "missing_skills": missing,
        "improvement_suggestions": suggestions,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze a resume and optionally compare to a job description (ATS-style).")
    parser.add_argument("resume", help="Path to resume file (PDF, DOCX, TXT)")
    parser.add_argument("job", nargs="?", help="(Optional) Job description text or path to job description file")
    args = parser.parse_args()

    jd_input = None
    if args.job:
        job_path = Path(args.job)
        if job_path.exists():
            jd_input = job_path.read_text(encoding="utf-8", errors="ignore")
        else:
            jd_input = args.job

    res = analyze(args.resume)
    # If analyze returned an error object
    if isinstance(res, dict) and res.get("error"):
        print(json.dumps(res, indent=2))
        sys.exit(1)

    ats = compute_ats(res.get("text_snippet", "") + "\n" + (res.get("skills", []) and " ".join(res.get("skills", [])) or ""), jd_input)
    # Merge ATS data into result
    out = {**res, **ats}
    print(json.dumps(out, indent=2))

from __future__ import annotations

import re
from typing import Optional


PAN_RE = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")
AADHAAR_RE = re.compile(r"\b(\d{4}\s?\d{4}\s?\d{4})\b")
DATE_RE = re.compile(r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b")
POLICY_RE = re.compile(r"\b(?:policy|pol(?:icy)?\s*(?:no|number)|policy\s*#)\s*[:\-]?\s*([A-Z0-9\-\/]{6,})\b", re.I)
REG_RE = re.compile(r"\b([A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{4})\b")
AMOUNT_RE = re.compile(r"(?:rs\.?|inr|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)", re.I)


CATEGORY_KEYWORDS = {
    "pan": ["permanent account", "income tax", "pan card", "govt of india income"],
    "identity": ["aadhaar", "passport", "voter", "driving licence", "driving license", "identity"],
    "education": ["university", "marksheet", "mark sheet", "degree", "certificate of", "cbse", "semester"],
    "medical": ["hospital", "prescription", "diagnosis", "patient", "lab report", "medical"],
    "insurance": ["insurance", "premium", "policy number", "sum insured", "nominee"],
    "property": ["sale deed", "khata", "property", "encumbrance", "survey no"],
    "financial": ["bank", "passbook", "account statement", "ifsc", "mutual fund", "fd receipt"],
}


def _first(pattern: re.Pattern[str], text: str) -> Optional[str]:
    match = pattern.search(text)
    return match.group(1).strip() if match else None


def _confidence(value: Optional[str], base: float) -> Optional[float]:
    if not value:
        return None
    return base


def classify_category(text: str) -> str:
    lowered = text.lower()
    if PAN_RE.search(text) and "pan" in lowered:
        return "pan"
    scores: dict[str, int] = {}
    for category, words in CATEGORY_KEYWORDS.items():
        scores[category] = sum(1 for word in words if word in lowered)
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "other"
    return best


def classify_and_extract(text: str) -> dict:
    category = classify_category(text)
    fields: list[dict] = []

    def add(name: str, value: Optional[str], confidence: Optional[float]) -> None:
        fields.append({"name": name, "value": value, "confidence": confidence})

    dates = DATE_RE.findall(text)
    issue = dates[0] if dates else None
    expiry = dates[1] if len(dates) > 1 else None

    if category == "pan":
        add("pan_number", _first(PAN_RE, text), _confidence(_first(PAN_RE, text), 92))
        add("issue_date", issue, 60 if issue else None)
    elif category == "identity":
        aadhaar = _first(AADHAAR_RE, text)
        add("id_number", aadhaar or _first(PAN_RE, text), 70 if aadhaar else None)
        add("issue_date", issue, 55 if issue else None)
        add("expiry_date", expiry, 55 if expiry else None)
    elif category == "insurance":
        add("policy_number", _first(POLICY_RE, text), 75 if _first(POLICY_RE, text) else None)
        add("premium_amount", _first(AMOUNT_RE, text), 60 if _first(AMOUNT_RE, text) else None)
        add("expiry_date", expiry or issue, 60 if (expiry or issue) else None)
    elif category == "property":
        add("registration_number", _first(REG_RE, text), 65 if _first(REG_RE, text) else None)
        add("issue_date", issue, 55 if issue else None)
    elif category == "financial":
        add("amount", _first(AMOUNT_RE, text), 60 if _first(AMOUNT_RE, text) else None)
        add("issue_date", issue, 55 if issue else None)
    elif category == "education":
        add("issue_date", issue, 55 if issue else None)
    elif category == "medical":
        add("issue_date", issue, 55 if issue else None)
        add("expiry_date", expiry, 50 if expiry else None)
    else:
        add("issue_date", issue, 50 if issue else None)
        add("expiry_date", expiry, 50 if expiry else None)

    name_match = re.search(r"(?:name|holder)\s*[:\-]\s*([A-Za-z][A-Za-z .]{2,60})", text, re.I)
    add("holder_name", name_match.group(1).strip() if name_match else None, 65 if name_match else None)

    return {"category": category, "fields": fields}

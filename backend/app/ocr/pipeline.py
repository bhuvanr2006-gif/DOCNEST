from __future__ import annotations

import io
import re
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

import fitz
import numpy as np
from PIL import Image, ImageOps

from app.ocr.extractors import classify_and_extract

try:
    import cv2
except ImportError:  # pragma: no cover
    cv2 = None

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None


ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_PIXELS = 20_000_000


@dataclass
class FieldResult:
    name: str
    value: Optional[str]
    confidence: Optional[float]
    source: str = "ocr"


@dataclass
class OCRResult:
    text: str
    confidence: Optional[float]
    category: str
    fields: list[FieldResult] = field(default_factory=list)
    quality_score: Optional[float] = None
    quality_notes: list[str] = field(default_factory=list)
    used_embedded_text: bool = False


def validate_upload(filename: str, content_type: str | None, data: bytes, max_bytes: int) -> None:
    from pathlib import Path

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise ValueError("Unsupported file type. Allowed: PDF, JPG, JPEG, PNG.")
    if len(data) > max_bytes:
        raise ValueError("File exceeds the maximum upload size.")
    if ext in {".jpg", ".jpeg"} and not data.startswith(b"\xff\xd8"):
        raise ValueError("File content does not match a JPEG image.")
    if ext == ".png" and not data.startswith(b"\x89PNG"):
        raise ValueError("File content does not match a PNG image.")
    if ext == ".pdf" and not data.startswith(b"%PDF"):
        raise ValueError("File content does not match a PDF document.")


def _pil_to_cv(image: Image.Image):
    arr = np.array(image.convert("RGB"))
    if cv2 is None:
        return arr
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def assess_quality(image: Image.Image) -> tuple[float, list[str]]:
    notes: list[str] = []
    arr = np.array(ImageOps.grayscale(image)).astype(np.float32)
    if arr.size == 0:
        return 0.0, ["empty image"]
    var = float(arr.var())
    score = min(100.0, var / 40.0)
    if var < 80:
        notes.append("Image may be too blurry or low-contrast for reliable OCR.")
    if min(image.size) < 400:
        notes.append("Resolution is low; extracted fields may need manual correction.")
        score = min(score, 55)
    mean = float(arr.mean())
    if mean < 40 or mean > 230:
        notes.append("Lighting appears too dark or too bright.")
        score = min(score, 60)
    return round(score, 1), notes


def _deskew(gray):
    if cv2 is None:
        return gray
    coords = np.column_stack(np.where(gray < 200))
    if coords.size == 0:
        return gray
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    if abs(angle) < 0.5 or abs(angle) > 20:
        return gray
    h, w = gray.shape[:2]
    matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    return cv2.warpAffine(gray, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)


def preprocess_image(image: Image.Image) -> Image.Image:
    if cv2 is None:
        return ImageOps.grayscale(image)
    bgr = _pil_to_cv(image)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 15, 7, 21)
    gray = _deskew(gray)
    gray = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
    )
    return Image.fromarray(gray)


def _ocr_image(image: Image.Image) -> tuple[str, Optional[float]]:
    if pytesseract is None:
        return "", None
    processed = preprocess_image(image)
    try:
        data = pytesseract.image_to_data(processed, output_type=pytesseract.Output.DICT)
    except Exception:
        return "", None
    words = []
    confs = []
    for text, conf in zip(data.get("text", []), data.get("conf", [])):
        token = (text or "").strip()
        try:
            c = float(conf)
        except (TypeError, ValueError):
            c = -1
        if token:
            words.append(token)
            if c >= 0:
                confs.append(c)
    mean_conf = sum(confs) / len(confs) if confs else None
    return " ".join(words), mean_conf


def _render_pdf_pages(data: bytes) -> list[Image.Image]:
    images: list[Image.Image] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            images.append(Image.open(io.BytesIO(pix.tobytes("png"))))
    return images


def _pdf_embedded_text(data: bytes) -> str:
    parts: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            text = page.get_text("text") or ""
            if text.strip():
                parts.append(text)
    return "\n".join(parts).strip()


def process_document(filename: str, data: bytes) -> OCRResult:
    from pathlib import Path

    ext = Path(filename).suffix.lower()
    notes: list[str] = []
    quality_scores: list[float] = []
    used_embedded = False
    text = ""
    confidence: Optional[float] = None

    if ext == ".pdf":
        embedded = _pdf_embedded_text(data)
        if len(embedded) >= 40:
            text = embedded
            used_embedded = True
            confidence = 95.0
        else:
            page_texts = []
            confs = []
            for image in _render_pdf_pages(data):
                q, qn = assess_quality(image)
                quality_scores.append(q)
                notes.extend(qn)
                t, c = _ocr_image(image)
                page_texts.append(t)
                if c is not None:
                    confs.append(c)
            text = "\n".join(page_texts)
            confidence = sum(confs) / len(confs) if confs else None
    else:
        image = Image.open(io.BytesIO(data))
        image.load()
        if image.width * image.height > MAX_PIXELS:
            raise ValueError("Image is too large to process safely.")
        q, qn = assess_quality(image)
        quality_scores.append(q)
        notes.extend(qn)
        text, confidence = _ocr_image(image)

    if not text.strip():
        notes.append("No text could be extracted. Enter fields manually.")

    classification = classify_and_extract(text)
    fields = [
        FieldResult(name=item["name"], value=item["value"], confidence=item.get("confidence"))
        for item in classification["fields"]
    ]
    quality = round(sum(quality_scores) / len(quality_scores), 1) if quality_scores else None
    unique_notes = list(dict.fromkeys(notes))
    return OCRResult(
        text=text,
        confidence=confidence,
        category=classification["category"],
        fields=fields,
        quality_score=quality,
        quality_notes=unique_notes,
        used_embedded_text=used_embedded,
    )


def parse_date(value: str | None) -> date | None:
    if not value:
        return None
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d.%m.%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    match = re.search(r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})", value)
    if match:
        d, m, y = int(match.group(1)), int(match.group(2)), int(match.group(3))
        try:
            return date(y, m, d)
        except ValueError:
            return None
    return None

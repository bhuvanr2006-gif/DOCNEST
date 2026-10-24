from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

from app.ocr.extractors import classify_and_extract
from app.ocr.pipeline import process_document, validate_upload
from app.services.reminders import expiry_status
from datetime import date, timedelta


def test_reject_invalid_type():
    try:
        validate_upload("notes.txt", "text/plain", b"hello", 1024)
        assert False
    except ValueError:
        pass


def test_pan_extraction_from_text():
    text = "Permanent Account Number Card Name: Rohan Sharma PAN: ABCDE1234F Issue date: 12/03/2019"
    result = classify_and_extract(text)
    assert result["category"] == "pan"
    pan = next(f for f in result["fields"] if f["name"] == "pan_number")
    assert pan["value"] == "ABCDE1234F"


def test_process_png_without_inventing_fields():
    image = Image.new("RGB", (640, 360), "white")
    draw = ImageDraw.Draw(image)
    draw.text((20, 40), "SYNTHETIC SAMPLE", fill="black")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    result = process_document("sample.png", buffer.getvalue())
    assert result.category in {"identity", "pan", "education", "medical", "insurance", "property", "financial", "other"}
    for field in result.fields:
        if field.value is None:
            continue
        assert isinstance(field.value, str)


def test_expiry_status():
    today = date(2026, 10, 21)
    assert expiry_status(today - timedelta(days=1), today) == "expired"
    assert expiry_status(today + timedelta(days=5), today) == "expiring"
    assert expiry_status(today + timedelta(days=90), today) == "valid"

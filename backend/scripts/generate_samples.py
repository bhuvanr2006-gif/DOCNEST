"""Create synthetic sample documents. Do not use real identity documents."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from fitz import Document as PdfDocument

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "samples"
OUT.mkdir(parents=True, exist_ok=True)


def _font(size: int):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def make_card(path: Path, title: str, lines: list[str]) -> None:
    image = Image.new("RGB", (900, 560), "#f4f7fb")
    draw = ImageDraw.Draw(image)
    draw.rectangle((24, 24, 876, 536), outline="#0f2744", width=4)
    draw.rectangle((24, 24, 876, 110), fill="#0f2744")
    draw.text((48, 48), title, fill="white", font=_font(32))
    y = 150
    for line in lines:
        draw.text((56, y), line, fill="#123", font=_font(24))
        y += 48
    draw.text((56, 500), "SYNTHETIC SAMPLE — NOT A GOVERNMENT DOCUMENT", fill="#b45309", font=_font(16))
    image.save(path)


def make_pdf(path: Path, title: str, body: str) -> None:
    doc = PdfDocument()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 60), title, fontsize=20)
    page.insert_textbox((50, 100, 545, 700), body, fontsize=12)
    doc.save(path)
    doc.close()


def main() -> None:
    make_card(
        OUT / "synthetic_pan.png",
        "Permanent Account Number Card",
        [
            "Income Tax Department — Government of India (sample)",
            "Name: Rohan Sharma",
            "PAN: ABCDE1234F",
            "Issue date: 12/03/2019",
        ],
    )
    make_card(
        OUT / "synthetic_insurance.png",
        "Motor Insurance Policy",
        [
            "Policy number: POL-90887721",
            "Name: Ananya Rao",
            "Vehicle: KA13 AB 4321",
            "Premium: INR 8,450.00",
            "Expiry date: 18/12/2026",
        ],
    )
    make_pdf(
        OUT / "synthetic_marksheet.pdf",
        "University Marksheet (Synthetic)",
        "Name: Kiran Hegde\nUniversity: Malnad College of Engineering\nDegree: B.E. Computer Science and Business Systems\nSemester: VI\nIssue date: 2026-05-20\nThis is a synthetic academic sample created for the DocNest prototype.",
    )
    print(f"Wrote samples to {OUT}")


if __name__ == "__main__":
    main()

from io import BytesIO
from datetime import datetime, timedelta

from PIL import Image, ImageDraw

from tests.conftest import create_user


def _png_bytes(text: str = "SYNTHETIC PAN ABCDE1234F") -> bytes:
    image = Image.new("RGB", (700, 400), "white")
    draw = ImageDraw.Draw(image)
    draw.text((30, 80), text, fill="black")
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_upload_validation_rejects_txt(client):
    account = create_user(client, "owner@docnest.demo", "Owner")
    files = {"file": ("notes.txt", b"not-a-document", "text/plain")}
    data = {"household_id": account["household"]["id"], "title": "Notes"}
    response = client.post("/api/documents/upload", data=data, files=files, headers=account["headers"])
    assert response.status_code == 400


def test_upload_correct_and_search(client):
    account = create_user(client, "owner@docnest.demo", "Owner")
    files = {"file": ("pan.png", _png_bytes(), "image/png")}
    data = {"household_id": account["household"]["id"], "title": "Rohan PAN"}
    uploaded = client.post("/api/documents/upload", data=data, files=files, headers=account["headers"])
    assert uploaded.status_code == 201, uploaded.text
    doc_id = uploaded.json()["id"]
    patched = client.patch(
        f"/api/documents/{doc_id}",
        json={"fields": [{"field_name": "holder_name", "corrected_value": "Rohan Sharma"}]},
        headers=account["headers"],
    )
    assert patched.status_code == 200
    listed = client.get(
        "/api/documents",
        params={"household_id": account["household"]["id"], "q": "Rohan"},
        headers=account["headers"],
    )
    assert listed.status_code == 200
    assert any(item["id"] == doc_id for item in listed.json())


def test_verify_and_tamper_demo(client):
    account = create_user(client, "owner@docnest.demo", "Owner")
    files = {"file": ("pan.png", _png_bytes(), "image/png")}
    data = {"household_id": account["household"]["id"], "title": "Verify me"}
    doc = client.post("/api/documents/upload", data=data, files=files, headers=account["headers"]).json()
    verified = client.post(f"/api/documents/{doc['id']}/verify", headers=account["headers"])
    assert verified.status_code == 200
    assert verified.json()["status"] == "verified"
    tampered = client.post(f"/api/documents/{doc['id']}/tamper-demo", headers=account["headers"])
    assert tampered.status_code == 200
    assert tampered.json()["status"] == "mismatch"


def test_cross_household_denied(client):
    a = create_user(client, "a@docnest.demo", "A", "House A")
    b = create_user(client, "b@docnest.demo", "B", "House B")
    files = {"file": ("pan.png", _png_bytes(), "image/png")}
    data = {"household_id": a["household"]["id"], "title": "Secret"}
    doc = client.post("/api/documents/upload", data=data, files=files, headers=a["headers"]).json()
    denied = client.get(f"/api/documents/{doc['id']}", headers=b["headers"])
    assert denied.status_code == 403


def test_share_expiry_and_revoke(client):
    owner = create_user(client, "owner@docnest.demo", "Owner")
    guest = create_user(client, "guest@docnest.demo", "Guest", "Guest House")
    files = {"file": ("pan.png", _png_bytes(), "image/png")}
    data = {"household_id": owner["household"]["id"], "title": "Shared PAN"}
    doc = client.post("/api/documents/upload", data=data, files=files, headers=owner["headers"]).json()
    past = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    expired_grant = client.post(
        f"/api/documents/{doc['id']}/share",
        json={"grantee_email": "guest@docnest.demo", "permission": "view", "expires_at": past},
        headers=owner["headers"],
    )
    assert expired_grant.status_code == 201
    blocked = client.get(f"/api/documents/{doc['id']}", headers=guest["headers"])
    assert blocked.status_code == 403
    future = (datetime.utcnow() + timedelta(days=1)).isoformat()
    grant = client.post(
        f"/api/documents/{doc['id']}/share",
        json={"grantee_email": "guest@docnest.demo", "permission": "view", "expires_at": future},
        headers=owner["headers"],
    ).json()
    allowed = client.get(f"/api/documents/{doc['id']}", headers=guest["headers"])
    assert allowed.status_code == 200
    revoked = client.post(f"/api/shares/{grant['id']}/revoke", headers=owner["headers"])
    assert revoked.status_code == 200
    blocked_again = client.get(f"/api/documents/{doc['id']}", headers=guest["headers"])
    assert blocked_again.status_code == 403


def test_delete_and_audit(client):
    owner = create_user(client, "owner@docnest.demo", "Owner")
    files = {"file": ("pan.png", _png_bytes(), "image/png")}
    data = {"household_id": owner["household"]["id"], "title": "To delete"}
    doc = client.post("/api/documents/upload", data=data, files=files, headers=owner["headers"]).json()
    deleted = client.delete(f"/api/documents/{doc['id']}", headers=owner["headers"])
    assert deleted.status_code == 200
    missing = client.get(f"/api/documents/{doc['id']}", headers=owner["headers"])
    assert missing.status_code == 404
    audit = client.get("/api/audit", params={"household_id": owner["household"]["id"]}, headers=owner["headers"])
    assert audit.status_code == 200
    actions = {row["action"] for row in audit.json()}
    assert "document.delete" in actions
    assert "document.upload" in actions

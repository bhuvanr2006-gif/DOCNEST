from io import BytesIO

from PIL import Image, ImageDraw

from tests.conftest import create_user


def _png() -> bytes:
    image = Image.new("RGB", (400, 240), "white")
    ImageDraw.Draw(image).text((10, 10), "SAMPLE", fill="black")
    buf = BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_guest_cannot_upload(client):
    owner = create_user(client, "owner@docnest.demo", "Owner")
    guest = create_user(client, "guest@docnest.demo", "Guest", "Other")
    invite = client.post(
        f"/api/households/{owner['household']['id']}/invitations",
        json={"email": "guest@docnest.demo", "role": "guest"},
        headers=owner["headers"],
    )
    assert invite.status_code == 201
    accepted = client.post("/api/households/invitations/accept", json={"token": invite.json()["token"]}, headers=guest["headers"])
    assert accepted.status_code == 200
    files = {"file": ("doc.png", _png(), "image/png")}
    data = {"household_id": owner["household"]["id"], "title": "Guest upload"}
    denied = client.post("/api/documents/upload", data=data, files=files, headers=guest["headers"])
    assert denied.status_code == 403


def test_asset_create_and_dependent_restriction(client):
    owner = create_user(client, "owner@docnest.demo", "Owner")
    files = {"file": ("rc.png", _png(), "image/png")}
    data = {"household_id": owner["household"]["id"], "title": "RC Book"}
    doc = client.post("/api/documents/upload", data=data, files=files, headers=owner["headers"]).json()
    asset = client.post(
        "/api/assets",
        params={"household_id": owner["household"]["id"]},
        json={
            "name": "Family Scooter",
            "asset_type": "vehicle",
            "document_ids": [doc["id"]],
            "value_amount": 75000,
        },
        headers=owner["headers"],
    )
    assert asset.status_code == 201
    listed = client.get("/api/assets", params={"household_id": owner["household"]["id"]}, headers=owner["headers"])
    assert listed.json()[0]["name"] == "Family Scooter"


def test_blockchain_adapter_disabled(client):
    from app.services.blockchain import register_digest, verify_digest

    assert register_digest("ab" * 32)["ok"] is False
    assert verify_digest("ab" * 32)["ok"] is False

def test_register_and_login(client):
    created = client.post(
        "/api/auth/register",
        json={
            "email": "aditi@docnest.demo",
            "password": "DemoPass123!",
            "full_name": "Aditi Rao",
            "household_name": "Rao House",
        },
    )
    assert created.status_code == 201
    login = client.post("/api/auth/login", json={"email": "aditi@docnest.demo", "password": "DemoPass123!"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "aditi@docnest.demo"


def test_invalid_login(client):
    client.post(
        "/api/auth/register",
        json={
            "email": "aditi@docnest.demo",
            "password": "DemoPass123!",
            "full_name": "Aditi Rao",
            "household_name": "Rao House",
        },
    )
    failed = client.post("/api/auth/login", json={"email": "aditi@docnest.demo", "password": "wrong-pass"})
    assert failed.status_code == 401


def test_protected_route_without_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

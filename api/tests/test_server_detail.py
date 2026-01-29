from api.app import create_app
from api.routes import servers as servers_routes


def test_server_detail_returns_payload(monkeypatch):
    app = create_app()
    client = app.test_client()

    sample = {
        "host": "127.0.0.1",
        "hostname": None,
        "lastOnline": 1700000000,
        "lastOnlinePlayers": 12,
        "lastOnlinePlayersMax": 100,
        "lastOnlinePlayersList": [{"name": "Steve", "uuid": None}],
        "lastOnlineVersion": "1.20.4",
        "lastOnlineVersionProtocol": "765",
        "lastOnlineDescription": "Test server",
        "lastOnlinePing": 42,
        "cracked": False,
        "whitelisted": True,
        "favicon": None,
        "extra": {"region": "us-east"},
    }

    monkeypatch.setattr(servers_routes, "get_server_detail", lambda host: sample)

    response = client.get("/servers/127.0.0.1")
    assert response.status_code == 200
    body = response.get_json()
    assert body["host"] == "127.0.0.1"
    assert body["lastOnlinePlayersList"][0]["name"] == "Steve"
    assert body["extra"]["region"] == "us-east"


def test_server_detail_not_found(monkeypatch):
    app = create_app()
    client = app.test_client()

    monkeypatch.setattr(servers_routes, "get_server_detail", lambda host: None)

    response = client.get("/servers/203.0.113.10")
    assert response.status_code == 404
    body = response.get_json()
    assert body["error"] == "Not found"

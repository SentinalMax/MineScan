from api.app import create_app
from api.routes import servers as servers_routes


def test_list_servers_default_sort(monkeypatch):
    app = create_app()
    client = app.test_client()
    captured = {}

    def fake_list(query, limit, offset, sort_field, sort_order, **kwargs):
        captured["query"] = query
        captured["limit"] = limit
        captured["offset"] = offset
        captured["sort_field"] = sort_field
        captured["sort_order"] = sort_order
        return {"total": 0, "items": []}

    monkeypatch.setattr(servers_routes, "get_server_list", fake_list)

    response = client.get("/servers")
    assert response.status_code == 200
    assert captured["sort_field"] == "lastOnlinePlayers"
    assert captured["sort_order"] == "desc"


def test_list_servers_query_params(monkeypatch):
    app = create_app()
    client = app.test_client()
    captured = {}

    def fake_list(query, limit, offset, sort_field, sort_order, **kwargs):
        captured["query"] = query
        captured["limit"] = limit
        captured["offset"] = offset
        captured["sort_field"] = sort_field
        captured["sort_order"] = sort_order
        return {"total": 1, "items": [{"host": "127.0.0.1"}]}

    monkeypatch.setattr(servers_routes, "get_server_list", fake_list)

    response = client.get(
        "/servers?q=demo&limit=25&offset=5&sort=lastOnline&order=asc"
    )
    assert response.status_code == 200
    assert captured["query"] == "demo"
    assert captured["limit"] == 25
    assert captured["offset"] == 5
    assert captured["sort_field"] == "lastOnline"
    assert captured["sort_order"] == "asc"

from flask import Blueprint, jsonify, request

from api.services.server_queries import get_server_detail, get_server_list

servers_bp = Blueprint("servers", __name__)

ALLOWED_SORT_FIELDS = {
    "lastOnline",
    "lastOnlinePlayers",
    "lastOnlineVersion",
    "serverType",
    "whitelisted",
    "cracked",
}
ALLOWED_SORT_ORDERS = {"asc", "desc"}


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _parse_optional_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _parse_optional_bool(value: str | None) -> bool | None:
    if value is None or value == "":
        return None
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes"}:
        return True
    if normalized in {"false", "0", "no"}:
        return False
    return None


@servers_bp.get("")
def list_servers():
    query = request.args.get("q")
    limit = _parse_int(request.args.get("limit"), 100)
    offset = _parse_int(request.args.get("offset"), 0)
    sort_field = request.args.get("sort") or "lastOnlinePlayers"
    sort_order = request.args.get("order") or "desc"
    min_players = _parse_optional_int(request.args.get("minPlayers"))
    max_players = _parse_optional_int(request.args.get("maxPlayers"))
    last_online_after = _parse_optional_int(request.args.get("lastOnlineAfter"))
    last_online_before = _parse_optional_int(request.args.get("lastOnlineBefore"))
    version = request.args.get("version") or None
    server_type = request.args.get("serverType") or None
    whitelisted = _parse_optional_bool(request.args.get("whitelisted"))
    cracked = _parse_optional_bool(request.args.get("cracked"))

    if sort_field not in ALLOWED_SORT_FIELDS:
        return jsonify({"error": "Invalid sort field"}), 400
    if sort_order not in ALLOWED_SORT_ORDERS:
        return jsonify({"error": "Invalid sort order"}), 400
    if request.args.get("minPlayers") and min_players is None:
        return jsonify({"error": "Invalid minPlayers value"}), 400
    if request.args.get("maxPlayers") and max_players is None:
        return jsonify({"error": "Invalid maxPlayers value"}), 400
    if request.args.get("lastOnlineAfter") and last_online_after is None:
        return jsonify({"error": "Invalid lastOnlineAfter value"}), 400
    if request.args.get("lastOnlineBefore") and last_online_before is None:
        return jsonify({"error": "Invalid lastOnlineBefore value"}), 400
    if request.args.get("whitelisted") and whitelisted is None:
        return jsonify({"error": "Invalid whitelisted value"}), 400
    if request.args.get("cracked") and cracked is None:
        return jsonify({"error": "Invalid cracked value"}), 400

    limit = max(1, min(limit, 1000))
    offset = max(0, offset)

    payload = get_server_list(
        query=query,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_order=sort_order,
        min_players=min_players,
        max_players=max_players,
        last_online_after=last_online_after,
        last_online_before=last_online_before,
        version=version,
        server_type=server_type,
        whitelisted=whitelisted,
        cracked=cracked,
    )
    return jsonify(payload)


@servers_bp.get("/<host>")
def get_server(host: str):
    detail = get_server_detail(host)
    if detail is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(detail)

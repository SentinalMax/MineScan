from flask import Blueprint, jsonify, request

from api.services.server_queries import get_server_detail, get_server_list

servers_bp = Blueprint("servers", __name__)

ALLOWED_SORT_FIELDS = {"lastOnline", "lastOnlinePlayers", "lastOnlineVersion"}
ALLOWED_SORT_ORDERS = {"asc", "desc"}


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@servers_bp.get("")
def list_servers():
    query = request.args.get("q")
    limit = _parse_int(request.args.get("limit"), 100)
    offset = _parse_int(request.args.get("offset"), 0)
    sort_field = request.args.get("sort") or "lastOnlinePlayers"
    sort_order = request.args.get("order") or "desc"

    if sort_field not in ALLOWED_SORT_FIELDS:
        return jsonify({"error": "Invalid sort field"}), 400
    if sort_order not in ALLOWED_SORT_ORDERS:
        return jsonify({"error": "Invalid sort order"}), 400

    limit = max(1, min(limit, 1000))
    offset = max(0, offset)

    payload = get_server_list(
        query=query,
        limit=limit,
        offset=offset,
        sort_field=sort_field,
        sort_order=sort_order,
    )
    return jsonify(payload)


@servers_bp.get("/<host>")
def get_server(host: str):
    detail = get_server_detail(host)
    if detail is None:
        return jsonify({"error": "Not found"}), 404
    return jsonify(detail)

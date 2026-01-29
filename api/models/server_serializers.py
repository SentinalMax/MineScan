from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

try:
    from bson import ObjectId
except Exception:  # pragma: no cover - bson may not be installed for tests
    ObjectId = None  # type: ignore


SUMMARY_FIELDS = [
    "host",
    "hostname",
    "lastOnline",
    "lastOnlinePlayers",
    "lastOnlinePlayersMax",
    "lastOnlineVersion",
    "lastOnlineDescription",
    "lastOnlinePing",
]

DETAIL_FIELDS = SUMMARY_FIELDS + [
    "lastOnlinePlayersList",
    "lastOnlineVersionProtocol",
    "cracked",
    "whitelisted",
    "favicon",
]


def _normalize_value(value: Any) -> Any:
    if ObjectId is not None and isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {key: _normalize_value(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    return value


def _resolve_host(document: Dict[str, Any]) -> Optional[str]:
    host = document.get("host") or document.get("_id")
    if host is None:
        return None
    return str(host)


def _serialize_players(
    raw_players: Optional[Iterable[Any]],
) -> List[Dict[str, Optional[str]]]:
    if not raw_players:
        return []

    normalized: List[Dict[str, Optional[str]]] = []
    for entry in raw_players:
        if isinstance(entry, dict):
            name = entry.get("name") if entry.get("name") else None
            uuid = entry.get("uuid") if entry.get("uuid") else None
            if name is None and uuid is None:
                continue
            normalized.append({"name": name or "", "uuid": uuid})
        elif isinstance(entry, str):
            normalized.append({"name": entry, "uuid": None})
    return normalized


def serialize_server_summary(document: Dict[str, Any]) -> Dict[str, Any]:
    serialized = {field: document.get(field) for field in SUMMARY_FIELDS}
    serialized["host"] = _resolve_host(document)
    return serialized


def serialize_server_detail(document: Dict[str, Any]) -> Dict[str, Any]:
    serialized = {field: document.get(field) for field in DETAIL_FIELDS}
    serialized["host"] = _resolve_host(document)
    serialized["lastOnlinePlayersList"] = _serialize_players(
        document.get("lastOnlinePlayersList"),
    )

    known_fields = set(DETAIL_FIELDS + ["_id", "extra"])
    extra = {
        key: _normalize_value(value)
        for key, value in document.items()
        if key not in known_fields
    }
    serialized["extra"] = extra
    return serialized

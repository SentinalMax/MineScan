from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from typing import List, Optional

from mcstatus import JavaServer

from api.models.server_serializers import (
    serialize_server_detail,
    serialize_server_summary,
)
from api.services.mongo_client import get_servers_collection

CACHE_TTL_SECONDS = 60
MAX_STATUS_WORKERS = 8
_status_cache: dict[str, tuple[bool, float]] = {}


def _check_online(host: str) -> bool:
    now = time.time()
    cached = _status_cache.get(host)
    if cached and now - cached[1] < CACHE_TTL_SECONDS:
        return cached[0]
    try:
        server = JavaServer.lookup(host, timeout=1.5)
        server.status()
        is_online = True
    except Exception:
        is_online = False
    _status_cache[host] = (is_online, now)
    return is_online


def get_server_detail(host: str) -> Optional[dict]:
    collection = get_servers_collection()
    document = collection.find_one({"$or": [{"host": host}, {"hostname": host}]})
    if not document:
        return None
    return serialize_server_detail(document)


def get_server_list(
    query: str | None = None,
    limit: int = 100,
    offset: int = 0,
    sort_field: str = "lastOnlinePlayers",
    sort_order: str = "desc",
    min_players: int | None = None,
    max_players: int | None = None,
    last_online_after: int | None = None,
    last_online_before: int | None = None,
    version: str | None = None,
    server_type: str | None = None,
    whitelisted: bool | None = None,
    cracked: bool | None = None,
) -> dict:
    collection = get_servers_collection()
    filter_query: dict = {}
    if query:
        filter_query = {
            "$or": [
                {"host": {"$regex": query, "$options": "i"}},
                {"hostname": {"$regex": query, "$options": "i"}},
            ]
        }
    if min_players is not None or max_players is not None:
        player_filter: dict = {}
        if min_players is not None:
            player_filter["$gte"] = min_players
        if max_players is not None:
            player_filter["$lte"] = max_players
        filter_query["lastOnlinePlayers"] = player_filter
    if last_online_after is not None or last_online_before is not None:
        last_online_filter: dict = {}
        if last_online_after is not None:
            last_online_filter["$gte"] = last_online_after
        if last_online_before is not None:
            last_online_filter["$lte"] = last_online_before
        filter_query["lastOnline"] = last_online_filter
    if version:
        filter_query["lastOnlineVersion"] = {"$regex": version, "$options": "i"}
    if server_type:
        filter_query["serverType"] = {"$regex": server_type, "$options": "i"}
    if whitelisted is not None:
        filter_query["whitelisted"] = whitelisted
    if cracked is not None:
        filter_query["cracked"] = cracked

    sort_direction = -1 if sort_order == "desc" else 1
    cursor = (
        collection.find(filter_query)
        .sort(sort_field, sort_direction)
        .skip(offset)
        .limit(limit)
    )
    total = collection.count_documents(filter_query)
    items: List[dict] = [serialize_server_summary(doc) for doc in cursor]

    with ThreadPoolExecutor(max_workers=MAX_STATUS_WORKERS) as executor:
        futures = {
            executor.submit(_check_online, item.get("host", "")): item
            for item in items
            if item.get("host")
        }
        for future, item in futures.items():
            item["isOnline"] = future.result()

    return {"total": total, "items": items}

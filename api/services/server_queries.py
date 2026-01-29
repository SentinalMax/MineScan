from __future__ import annotations

from typing import Optional

from typing import List

from api.models.server_serializers import (
    serialize_server_detail,
    serialize_server_summary,
)
from api.services.mongo_client import get_servers_collection


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

    sort_direction = -1 if sort_order == "desc" else 1
    cursor = (
        collection.find(filter_query)
        .sort(sort_field, sort_direction)
        .skip(offset)
        .limit(limit)
    )
    total = collection.count_documents(filter_query)
    items: List[dict] = [serialize_server_summary(doc) for doc in cursor]

    return {"total": total, "items": items}

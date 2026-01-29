from __future__ import annotations

import os
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

DEFAULT_MONGO_URL = "mongodb://mongo:27017/mc"
DEFAULT_DB_NAME = "mc"
DEFAULT_COLLECTION_NAME = "servers"


load_dotenv()


def get_mongo_client(mongo_url: Optional[str] = None) -> MongoClient:
    url = mongo_url or os.getenv("MONGO_URL", DEFAULT_MONGO_URL)
    return MongoClient(url, server_api=ServerApi("1"))


def get_servers_collection(
    mongo_url: Optional[str] = None,
    db_name: str = DEFAULT_DB_NAME,
    collection_name: str = DEFAULT_COLLECTION_NAME,
):
    client = get_mongo_client(mongo_url)
    return client[db_name][collection_name]

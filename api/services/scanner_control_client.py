import os
from typing import Any, Dict

import requests

DEFAULT_SCANNER_CONTROL_URL = "http://scanner:8081"


def _control_url(path: str) -> str:
    base = os.getenv("SCANNER_CONTROL_URL", DEFAULT_SCANNER_CONTROL_URL)
    return f"{base.rstrip('/')}{path}"


def start_scan(payload: Dict[str, Any]) -> Dict[str, Any]:
    response = requests.post(_control_url("/control/scans"), json=payload, timeout=10)
    response.raise_for_status()
    return response.json()


def list_scans() -> Dict[str, Any]:
    response = requests.get(_control_url("/control/scans"), timeout=10)
    response.raise_for_status()
    return response.json()


def stop_scan(scan_id: str) -> Dict[str, Any]:
    response = requests.post(
        _control_url(f"/control/scans/{scan_id}/stop"), timeout=10
    )
    response.raise_for_status()
    return response.json()

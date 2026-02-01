from __future__ import annotations

import ipaddress
import os
import threading
import time
import uuid
from typing import Dict, List, Optional, Tuple

from flask import Flask, jsonify, request

import scanCore

app = Flask(__name__)

_scan_lock = threading.Lock()
_scans: Dict[str, dict] = {}
_active_scan_id: Optional[str] = None
_avg_hosts_per_second = 0.0


def _parse_subnets(payload: dict) -> List[str]:
    subnets = payload.get("subnets")
    if isinstance(subnets, list):
        return [str(item) for item in subnets if str(item).strip()]
    subnet = payload.get("subnetCidr") or payload.get("subnet")
    if subnet:
        return [str(subnet)]
    return []


def _normalize_subnets(subnets: List[str]) -> Tuple[List[str], List[str]]:
    networks = []
    invalid = []
    for raw in subnets:
        try:
            networks.append(ipaddress.ip_network(str(raw), strict=False))
        except Exception:
            invalid.append(str(raw))
    if not networks:
        return [], invalid
    collapsed = list(ipaddress.collapse_addresses(networks))
    collapsed.sort(
        key=lambda net: (net.version, int(net.network_address), net.prefixlen)
    )
    return [str(net) for net in collapsed], invalid


def _estimate_seconds(hosts: int) -> Optional[int]:
    if _avg_hosts_per_second <= 0:
        return None
    return int(hosts / _avg_hosts_per_second)


def _run_scan(scan_id: str, subnets: List[str], max_active: Optional[int]) -> None:
    global _avg_hosts_per_second, _active_scan_id
    started_at = time.time()

    try:
        def progress_callback(subnet: str, hosts_scanned: int) -> None:
            with _scan_lock:
                scan = _scans.get(scan_id)
                if not scan:
                    return
                scan["hostsDone"] = scan.get("hostsDone", 0) + hosts_scanned
                scan["subnetsDone"] = scan.get("subnetsDone", 0) + 1

        with _scan_lock:
            _scans[scan_id]["status"] = "running"
            _scans[scan_id]["startedAt"] = started_at
            _scans[scan_id]["subnetsDone"] = 0
            _scans[scan_id]["hostsDone"] = 0

        scanCore.STOP_EVENT = threading.Event()
        scanCore.run_scanner(
            ip_lists_override=subnets,
            show_progress=False,
            show_live_counter=False,
            max_active_override=max_active,
            progress_callback=progress_callback,
            already_chunked=True,
        )
        finished_at = time.time()
        duration = max(finished_at - started_at, 1)
        host_count = _scans[scan_id]["hostCount"]
        if host_count:
            _avg_hosts_per_second = (host_count / duration + _avg_hosts_per_second) / 2
        with _scan_lock:
            _scans[scan_id]["status"] = (
                "stopped" if scanCore.STOP_EVENT.is_set() else "completed"
            )
            _scans[scan_id]["finishedAt"] = finished_at
            _scans[scan_id]["durationSeconds"] = int(duration)
    except Exception as exc:  # pragma: no cover - runtime safety
        with _scan_lock:
            _scans[scan_id]["status"] = "failed"
            _scans[scan_id]["error"] = str(exc)
    finally:
        with _scan_lock:
            _active_scan_id = None


@app.post("/control/scans")
def start_scan():
    global _active_scan_id
    payload = request.get_json(silent=True) or {}
    subnets = _parse_subnets(payload)
    if not subnets:
        return jsonify({"error": "subnets required"}), 400
    normalized, invalid = _normalize_subnets(subnets)
    if invalid:
        return (
            jsonify({"error": "invalid subnets", "invalidSubnets": invalid}),
            400,
        )
    if not normalized:
        return jsonify({"error": "subnets required"}), 400

    chunk_prefix_v4 = scanCore.get_chunk_prefix_v4()
    prepared_subnets, host_count = scanCore.prepare_ip_lists(
        normalized, chunk_prefix_v4=chunk_prefix_v4
    )
    if not prepared_subnets:
        return jsonify({"error": "subnets required"}), 400

    with _scan_lock:
        if _active_scan_id is not None:
            return jsonify({"error": "scan already running"}), 409

        scan_id = payload.get("scanId") or str(uuid.uuid4())
        scan_data = {
            "scanId": scan_id,
            "subnets": normalized,
            "status": "queued",
            "createdAt": time.time(),
            "hostCount": host_count,
            "totalSubnets": len(prepared_subnets),
            "estimatedSeconds": _estimate_seconds(host_count),
        }
        _scans[scan_id] = scan_data
        _active_scan_id = scan_id

    thread = threading.Thread(
        target=_run_scan,
        args=(scan_id, prepared_subnets, payload.get("maxActive")),
        daemon=True,
    )
    thread.start()

    return jsonify(scan_data), 202


@app.get("/control/scans")
def list_scans():
    with _scan_lock:
        scans = list(_scans.values())
    scans.sort(key=lambda item: item.get("createdAt", 0), reverse=True)
    return jsonify({"items": scans})


@app.post("/control/scans/<scan_id>/stop")
def stop_scan(scan_id: str):
    with _scan_lock:
        scan = _scans.get(scan_id)
        if scan is None:
            return jsonify({"error": "not found"}), 404
        if scan.get("status") not in {"queued", "running"}:
            return jsonify({"error": "scan not running"}), 409
        scan["status"] = "stopping"

    scanCore.STOP_EVENT.set()
    return jsonify({"status": "stopping"})


if __name__ == "__main__":
    port = int(os.getenv("SCANNER_CONTROL_PORT", "8081"))
    app.run(host="0.0.0.0", port=port)

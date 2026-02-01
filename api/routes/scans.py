import uuid

from flask import Blueprint, jsonify, request

from api.services.scanner_control_client import list_scans, start_scan, stop_scan

scans_bp = Blueprint("scans", __name__)


@scans_bp.get("")
def get_scans():
    try:
        return jsonify(list_scans())
    except Exception:
        return jsonify({"error": "Scanner control unavailable"}), 502


@scans_bp.post("")
def create_scan():
    payload = request.get_json(silent=True) or {}
    if "scanId" not in payload:
        payload["scanId"] = str(uuid.uuid4())
    try:
        return jsonify(start_scan(payload)), 202
    except Exception:
        return jsonify({"error": "Unable to start scan"}), 502


@scans_bp.post("/<scan_id>/stop")
def stop_scan_route(scan_id: str):
    try:
        return jsonify(stop_scan(scan_id))
    except Exception:
        return jsonify({"error": "Unable to stop scan"}), 502

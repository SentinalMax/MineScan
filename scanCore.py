import multiprocessing
import multiprocessing.pool
import queue
import subprocess
import sys
import threading
import time
import traceback
import os
import signal
import ipaddress

import masscan as msCan
import pymongo

import utils


def get_cpu_count():
    try:
        return len(os.sched_getaffinity(0))
    except Exception:
        return os.cpu_count() or 1


useWebHook = False
DEFAULT_PINGS_PER_SEC = 4800
DEFAULT_MAX_ACTIVE = get_cpu_count()
masscan_search_path = (
    "masscan",
    "/usr/bin/masscan",
    "/usr/local/bin/masscan",
    "/sw/bin/masscan",
    "/opt/local/bin/masscan",
)
DISCORD_WEBHOOK = "discord.api.com/..."
try:
    from privVars import *
except ImportError:
    MONGO_URL = "mongodb+srv://..."
    DSICORD_WEBHOOK = "discord.api.com/..."


if MONGO_URL == "mongodb+srv://...":
    print("Please add your mongo url to privVars.py")
    input()
    sys.exit()
if useWebHook and DISCORD_WEBHOOK == "discord.api.com/...":
    print("Please add your discord webhook to privVars.py")
    input()
    sys.exit()

# Setup
# ---------------------------------------------

DEBUG = True

STOP_EVENT = threading.Event()

client = pymongo.MongoClient(
    MONGO_URL, server_api=pymongo.server_api.ServerApi("1")
)  # type: ignore
db = client["mc"]
col = db["servers"]

utils = utils.utils(col, debug=DEBUG)
logger = utils.logger
finder = utils.finder

logger.info("Scanner startup")
logger.info("MongoDB database: mc, collection: servers")
try:
    client.admin.command("ping")
    logger.info("MongoDB connection: OK")
except Exception:
    logger.error("MongoDB connection: FAILED")
    logger.error(traceback.format_exc())

# Funcs
# ---------------------------------------------


def print(*args, **kwargs):
    logger.print(*args, **kwargs)


def _get_env_int(name, default, min_value=None, max_value=None):
    raw = os.getenv(name)
    if raw is None or str(raw).strip() == "":
        return default
    try:
        value = int(raw)
    except ValueError:
        logger.warning(f"Invalid {name}={raw}; using default {default}")
        return default
    if min_value is not None and value < min_value:
        logger.warning(f"{name}={value} below min {min_value}; using {min_value}")
        return min_value
    if max_value is not None and value > max_value:
        logger.warning(f"{name}={value} above max {max_value}; using {max_value}")
        return max_value
    return value


def get_chunk_prefix_v4():
    raw = os.getenv("SCAN_CHUNK_PREFIX_V4")
    if raw is None or str(raw).strip() == "":
        return None
    try:
        value = int(raw)
    except ValueError:
        logger.warning(f"Invalid SCAN_CHUNK_PREFIX_V4={raw}; chunking disabled")
        return None
    if value < 0 or value > 32:
        logger.warning(f"SCAN_CHUNK_PREFIX_V4={value} out of range; chunking disabled")
        return None
    return value


pingsPerSec = _get_env_int("SCAN_PINGS_PER_SEC", DEFAULT_PINGS_PER_SEC, min_value=1)
maxActive = _get_env_int("SCAN_MAX_ACTIVE", DEFAULT_MAX_ACTIVE, min_value=1)


def check(scannedHost):
    # example host: "127.0.0.1": [{"status": "open", "port": 25565, "proto": "tcp"}]

    try:
        if isinstance(scannedHost, dict):
            ip = list(scannedHost.keys())[0]
        elif isinstance(scannedHost, str):
            ip = scannedHost
        else:
            raise ValueError(f"Unexpected host type: {type(scannedHost)}")
    except Exception:
        logger.print("Error parsing host: " + str(scannedHost))
        logger.error(traceback.format_exc())
        return

    portsJson = (
        scannedHost[ip]
        if isinstance(scannedHost, dict)
        else [{"status": "open", "port": 25565, "proto": "tcp"}]
    )
    for portJson in portsJson:
        if portJson["status"] == "open":
            if useWebHook:
                return finder.check(
                    host=str(ip) + ":" + str(portJson["port"]),
                    webhook=DISCORD_WEBHOOK,
                    full=False,
                )
            else:
                return finder.check(
                    host=str(ip) + ":" + str(portJson["port"]), full=False
                )
    else:
        return


def scan(ip_list, show_live_counter=False):
    if STOP_EVENT.is_set():
        return []
    if show_live_counter:
        return scan_live(ip_list)

    try:
        scanner = msCan.PortScanner(masscan_search_path=masscan_search_path)
    except msCan.PortScannerError as exc:
        print(f"Masscan not found, please install it ({exc})")
        return []

    try:
        import json

        logger.info(f"Masscan start (python): {ip_list}")
        scanner.scan(
            ip_list,
            ports="25565-25577",
            arguments="--max-rate {}".format(pingsPerSec / maxActive),
            sudo=False,
        )
        if STOP_EVENT.is_set():
            return []
        result = json.loads(scanner.scan_result)
        logger.info(f"Masscan complete (python): {ip_list}")

        return list(result["scan"])
    except OSError:
        logger.error("Masscan failed with OSError")
        logger.error(traceback.format_exc())
        return []
    except Exception:
        logger.error(traceback.format_exc())
        return []


def scan_live(ip_list):
    try:
        from tqdm import tqdm
    except Exception:
        tqdm = None

    cmd = [
        "masscan",
        ip_list,
        "-p",
        "25565-25577",
        "--max-rate",
        str(pingsPerSec / maxActive),
        "--output-format",
        "list",
        "--output-filename",
        "-",
    ]
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
    except FileNotFoundError:
        logger.error("Masscan not found in PATH")
        return []
    except Exception:
        logger.error("Failed to start masscan")
        logger.error(traceback.format_exc())
        return []

    logger.info(f"Masscan start (subprocess): {ip_list}")
    counter = None
    if tqdm:
        counter = tqdm(desc="Open hosts", unit="host", dynamic_ncols=True)

    results = {}
    try:
        for raw_line in process.stdout:
            if STOP_EVENT.is_set():
                break
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("open "):
                parts = line.split()
                if len(parts) >= 4:
                    port = int(parts[2])
                    ip = parts[3]
                    if ip not in results:
                        results[ip] = []
                    results[ip].append(
                        {"status": "open", "port": port, "proto": "tcp"}
                    )
                    if counter is not None:
                        counter.update(1)
        if STOP_EVENT.is_set():
            process.terminate()
        process.wait()
    finally:
        if counter is not None:
            counter.close()

    logger.info(
        "Masscan complete (subprocess): {} (exit code {}, open hosts {})".format(
            ip_list, process.returncode, len(results)
        )
    )
    return [{ip: ports} for ip, ports in results.items()]


def disLog(text, end="\r"):
    if useWebHook:
        try:
            import requests

            url = DSICORD_WEBHOOK
            data = {"content": text + end}
            requests.post(url, data=data)
        except Exception:
            logger.error(text + "\n" + traceback.format_exc())


def _scan_subnet(
    ip_range,
    show_live_counter=False,
    progress_callback=None,
):
    try:
        if STOP_EVENT.is_set():
            return
        logger.info(f"Scan worker start: {ip_range}")
        ips = scan(ip_range, show_live_counter=show_live_counter)
        logger.info(f"Scan worker complete: {ip_range} (open hosts {len(ips)})")

        if len(ips) > 0:
            pool = multiprocessing.pool.ThreadPool(max(1, maxActive // 2))
            try:
                pool.map(check, ips)
            finally:
                pool.close()
                pool.join()
        if progress_callback is not None:
            try:
                hosts_scanned = ipaddress.ip_network(
                    ip_range, strict=False
                ).num_addresses
            except Exception:
                hosts_scanned = 0
            progress_callback(ip_range, hosts_scanned)
    except OSError:
        logger.error("Scan worker encountered OSError")
        logger.error(traceback.format_exc())
        return
    except Exception:
        logger.error(traceback.format_exc())


def _scan_worker(work_queue, show_live_counter=False, progress_callback=None):
    while not STOP_EVENT.is_set():
        try:
            ip_range = work_queue.get_nowait()
        except queue.Empty:
            return
        try:
            _scan_subnet(
                ip_range,
                show_live_counter=show_live_counter,
                progress_callback=progress_callback,
            )
        finally:
            work_queue.task_done()


# Main
# ---------------------------------------------


def get_default_ip_lists():
    return [
        "103.112.60.0/24",
        "62.115.0.0/16",
        "206.148.24.0/22",
        "99.82.128.0/18",
        "99.83.64.0/18",
        "4.0.0.0/9",
    ]




def _parse_network(cidr):
    try:
        return ipaddress.ip_network(cidr, strict=False)
    except Exception:
        logger.warning(f"Invalid CIDR skipped: {cidr}")
        return None


def prepare_ip_lists(ip_lists, chunk_prefix_v4=None):
    prepared = []
    host_count = 0
    for cidr in ip_lists:
        net = _parse_network(cidr)
        if net is None:
            continue
        host_count += net.num_addresses
        if net.version == 4 and chunk_prefix_v4 is not None:
            if net.prefixlen < chunk_prefix_v4:
                prepared.extend(
                    str(chunk) for chunk in net.subnets(new_prefix=chunk_prefix_v4)
                )
                continue
        prepared.append(str(net))
    return prepared, host_count


def run_scanner(
    ip_lists_override=None,
    show_progress=False,
    show_live_counter=False,
    max_active_override=None,
    progress_callback=None,
    chunk_prefix_v4=None,
    already_chunked=False,
):
    def _handle_stop(signum, frame):
        logger.warning("Stop signal received; shutting down")
        STOP_EVENT.set()

    if threading.current_thread() is threading.main_thread():
        signal.signal(signal.SIGINT, _handle_stop)
        signal.signal(signal.SIGTERM, _handle_stop)
    ip_lists = ip_lists_override or get_default_ip_lists()
    time.sleep(0.5)
    detected_cpus = get_cpu_count()
    if max_active_override is not None:
        global maxActive
        if max_active_override > detected_cpus:
            logger.warning(
                "Requested maxActive {} exceeds available CPUs {}; clamping".format(
                    max_active_override, detected_cpus
                )
            )
            maxActive = detected_cpus
        else:
            maxActive = max_active_override
    if chunk_prefix_v4 is None:
        chunk_prefix_v4 = get_chunk_prefix_v4()
    if not already_chunked and chunk_prefix_v4 is not None:
        ip_lists, _ = prepare_ip_lists(ip_lists, chunk_prefix_v4=chunk_prefix_v4)
    if not ip_lists:
        logger.warning("No scan targets after preparation; exiting")
        return
    worker_count = min(maxActive, len(ip_lists))
    logger.info(
        "Scan config: subnets={}, maxActive={}, pingsPerSec={}, "
        "progress={}, liveCounter={}, detectedCPUs={}, chunkPrefixV4={}".format(
            len(ip_lists),
            maxActive,
            pingsPerSec,
            show_progress,
            show_live_counter,
            detected_cpus,
            chunk_prefix_v4,
        )
    )
    progress_counter = None
    if show_progress:
        try:
            from tqdm import tqdm

            progress_counter = tqdm(
                total=len(ip_lists), desc="Subnets", unit="subnet"
            )
        except Exception:
            progress_counter = None

    def _wrapped_progress(subnet, hosts_scanned):
        if progress_callback is not None:
            progress_callback(subnet, hosts_scanned)
        if progress_counter is not None:
            progress_counter.update(1)

    work_queue = queue.Queue()
    for ip_list in ip_lists:
        work_queue.put(ip_list)

    worker_threads = []
    for idx in range(worker_count):
        t = threading.Thread(
            target=_scan_worker,
            args=(work_queue, show_live_counter, _wrapped_progress),
            name=f"Scan worker {idx + 1}",
        )
        worker_threads.append(t)
        t.start()

    for t in worker_threads:
        t.join()
    if progress_counter is not None:
        progress_counter.close()


if __name__ == "__main__":
    run_scanner()

import asyncio
import multiprocessing
import multiprocessing.pool
import subprocess
import sys
import threading
import time
import traceback
import os
import signal

import masscan as msCan
import pymongo

import utils


def get_cpu_count():
    try:
        return len(os.sched_getaffinity(0))
    except Exception:
        return os.cpu_count() or 1


useWebHook, pingsPerSec, maxActive = False, 4800, get_cpu_count()
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

threads = []
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


async def threader(ip_range, show_live_counter=False):
    try:
        if STOP_EVENT.is_set():
            return
        logger.info(f"Scan thread start: {ip_range}")
        ips = scan(ip_range, show_live_counter=show_live_counter)
        logger.info(f"Scan thread complete: {ip_range} (open hosts {len(ips)})")

        if len(ips) > 0:
            pool = multiprocessing.pool.ThreadPool(maxActive // 2)
            try:
                pool.map(check, ips)
            finally:
                pool.close()
                pool.join()
    except OSError:
        logger.error("Threader encountered OSError")
        logger.error(traceback.format_exc())
        return
    except Exception:
        logger.error(traceback.format_exc())


def crank(ip_range, show_live_counter=False):
    asyncio.run(threader(ip_range, show_live_counter=show_live_counter))


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




async def makeThreads(ip_lists, show_progress=False, show_live_counter=False):
    # Create a thread for each list of IPs
    normal = threading.active_count()
    spawn_window_start = time.time()
    spawned_in_window = 0
    iterator = ip_lists
    if show_progress:
        try:
            from tqdm import tqdm

            iterator = tqdm(ip_lists, desc="Subnets", unit="subnet")
        except Exception:
            iterator = ip_lists
    for ip_list in iterator:
        if STOP_EVENT.is_set():
            break
        # check to make sure that more than 2*maxActive threads haven't been created in the last 1 second
        now = time.time()
        if now - spawn_window_start > 1:
            spawn_window_start = now
            spawned_in_window = 0
        if spawned_in_window >= maxActive * 2:
            await asyncio.sleep(0.5)
            spawn_window_start = time.time()
            spawned_in_window = 0

        t = threading.Thread(
            target=crank,
            args=(ip_list, show_live_counter),
            name=f"Scan func thread: {ip_list}",
        )

        threads.append(t)
        spawned_in_window += 1

        # If the number of active threads is greater than the max, sleep for 0.1 seconds
        while threading.active_count() - normal >= maxActive:
            await asyncio.sleep(0.1)
        t.start()


def run_scanner(
    ip_lists_override=None,
    show_progress=False,
    show_live_counter=False,
    max_active_override=None,
):
    def _handle_stop(signum, frame):
        logger.warning("Stop signal received; shutting down")
        STOP_EVENT.set()

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
    logger.info(
        "Scan config: subnets={}, maxActive={}, pingsPerSec={}, "
        "progress={}, liveCounter={}, detectedCPUs={}".format(
            len(ip_lists),
            maxActive,
            pingsPerSec,
            show_progress,
            show_live_counter,
            detected_cpus,
        )
    )
    asyncio.run(
        makeThreads(
            ip_lists, show_progress=show_progress, show_live_counter=show_live_counter
        )
    )


if __name__ == "__main__":
    run_scanner()

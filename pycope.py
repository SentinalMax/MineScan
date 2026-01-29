import argparse
import atexit
import csv
import ipaddress
import os
import signal
import sys

from scanCore import get_default_ip_lists, run_scanner

__version__ = "1.0.0"


def parse_subnet_ranges(values):
    subnets = []
    for value in values:
        if not value:
            continue
        parts = [part.strip() for part in value.split(",")]
        subnets.extend([part for part in parts if part])
    return subnets


def load_subnet_list(path):
    subnets = []
    with open(path, newline="") as handle:
        reader = csv.reader(handle)
        for row in reader:
            if not row:
                continue
            first = row[0].strip()
            if not first:
                continue
            if first.lower() in {"startip", "cidr", "subnet"}:
                continue
            if "/" in first:
                subnets.append(first)
                continue

            if len(row) > 1:
                second = row[1].strip()
                if second and second.lower() != "endip":
                    try:
                        start_ip = ipaddress.ip_address(first)
                        end_ip = ipaddress.ip_address(second)
                    except ValueError:
                        continue
                    if start_ip.version == end_ip.version:
                        subnets.extend(
                            [
                                str(net)
                                for net in ipaddress.summarize_address_range(
                                    start_ip, end_ip
                                )
                            ]
                        )
    return subnets


DEFAULT_PID_FILE = "/tmp/pycope.pid"


def build_parser():
    parser = argparse.ArgumentParser(
        prog="pycope",
        description="pycopenheimer (pycope) v{}".format(__version__),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--version",
        action="version",
        version="pycopenheimer (pycope) v{}".format(__version__),
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    scan_parser = subparsers.add_parser("scan", help="Scan subnet ranges")
    scan_parser.add_argument(
        "--subnet-range",
        action="append",
        default=[],
        help="CIDR ranges, comma-separated or repeatable",
    )
    scan_parser.add_argument(
        "--subnet-list",
        help="CSV file containing CIDR ranges",
    )
    scan_parser.add_argument(
        "--no-progress",
        action="store_true",
        help="Disable tqdm progress display",
    )
    scan_parser.add_argument(
        "--no-live-counter",
        action="store_true",
        help="Disable live counter from masscan output",
    )
    scan_parser.add_argument(
        "--threads",
        type=int,
        help="Max active scan threads (defaults to current config)",
    )
    scan_parser.add_argument(
        "--no-defaults",
        action="store_true",
        help="Do not fall back to built-in subnets",
    )
    scan_parser.add_argument(
        "--pid-file",
        default=DEFAULT_PID_FILE,
        help="PID file path for stop command",
    )

    stop_parser = subparsers.add_parser("stop", help="Stop a running scan")
    stop_parser.add_argument(
        "--pid-file",
        default=DEFAULT_PID_FILE,
        help="PID file path for the running scan",
    )
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "scan":
        if args.threads is not None and args.threads <= 0:
            parser.error("--threads must be a positive integer")
        subnets = []
        subnets.extend(parse_subnet_ranges(args.subnet_range))
        if args.subnet_list:
            subnets.extend(load_subnet_list(args.subnet_list))

        if not subnets:
            if args.no_defaults:
                parser.error("No subnets provided and --no-defaults set")
            subnets = get_default_ip_lists()

        pid_file = args.pid_file
        pid_dir = os.path.dirname(pid_file)
        if pid_dir and not os.path.isdir(pid_dir):
            os.makedirs(pid_dir, exist_ok=True)
        with open(pid_file, "w", encoding="utf-8") as handle:
            handle.write(str(os.getpid()))
        atexit.register(lambda: os.path.exists(pid_file) and os.remove(pid_file))

        run_scanner(
            subnets,
            show_progress=not args.no_progress,
            show_live_counter=not args.no_live_counter,
            max_active_override=args.threads,
        )
        return 0

    if args.command == "stop":
        pid_file = args.pid_file
        if not os.path.exists(pid_file):
            print("No running scan found (missing PID file)")
            return 1
        try:
            with open(pid_file, "r", encoding="utf-8") as handle:
                pid = int(handle.read().strip())
        except Exception as exc:
            print(f"Invalid PID file: {exc}")
            return 1
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            print("Scan process not found; removing PID file")
            os.remove(pid_file)
            return 1
        except PermissionError:
            print("Permission denied sending stop signal")
            return 1
        print("Stop signal sent")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())

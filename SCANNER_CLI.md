# Scanner CLI

The scanner CLI runs the scan from inside the Docker container and shows a
progress bar while iterating over subnets.

## Build the image

```
docker compose up --build
```

## Help

```
docker compose run --rm scanner pycope --help
```

## Scan a single subnet

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9"
```

## Scan multiple subnets

Comma-separated:

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9,62.115.0.0/16"
```

Repeat the flag:

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9" --subnet-range "62.115.0.0/16"
```

## Scan from a CSV file

Create `list.csv` with one or more CIDR ranges (commas or newlines), or
`startIp,endIp` ranges:

```
4.0.0.0/9
62.115.0.0/16
```

Start/end range example:

```
startIp,endIp,ipVersion,datacenter,domain
103.167.10.0,103.167.10.255,4,Stripe Hosting,stripehosting.com.au
```

Run:

```
docker compose run --rm scanner pycope scan --subnet-list "list.csv"
```

## Disable the progress bar

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9" --no-progress
```

## Disable the live counter

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9" --no-live-counter
```

## Limit scan threads

By default, the scanner uses the detected CPU count in the container.

```
docker compose run --rm scanner pycope scan --subnet-range "4.0.0.0/9" --threads 8
```

## Require explicit subnets

```
docker compose run --rm scanner pycope scan --no-defaults --subnet-range "4.0.0.0/9"
```

## Stop a running scan

By default, `pycope scan` writes its PID to `/tmp/pycope.pid` and `pycope stop`
sends a SIGTERM to that process.

```
docker compose run --rm scanner pycope stop
```

Custom PID file:

```
docker compose run --rm scanner pycope scan --pid-file /tmp/scan.pid --subnet-range "4.0.0.0/9"
docker compose run --rm scanner pycope stop --pid-file /tmp/scan.pid
```

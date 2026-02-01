# MineScan

[![License](https://img.shields.io/github/license/Pilot1782/bad_copenheimer)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](requirements.txt)
[![Node](https://img.shields.io/badge/node-18%2B-green)](frontend/package.json)

MineScan is a full-stack Minecraft server scanner and explorer. It combines a scanner control service, a Mongo-backed API, and a modern web UI to discover, inspect, and manage scan results.

This repository is a fork created to revive and continue the previous **bad_copenheimer** project by **Pilot1782**.

## Highlights

- End-to-end scan lifecycle control (start, stop, monitor progress).
- Server discovery UI with search, sorting, and filtering.
- Detailed server metadata and health indicators.
- Containerized backend services for consistent local setup.
- Polished dark-mode UI built with Material UI.

## Additional Features

- CSV subnet uploads for batch scans.
- Real-time scan telemetry with progress and ETA.
- Server detail panels with extra metadata.
- Backend API for list + detail endpoints.
- Extensible data model for additional metadata fields.

## Architecture

```
frontend/        React UI (Vite + MUI)
api/             Flask API (Mongo-backed)
scanner_control.py  Scanner control service
scanCore.py      Scanner engine
```

## Quick Start

### Docker (recommended)

```
docker-compose up --build
```

### Local Development

```
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python api/app.py
```

```
cd frontend
npm install
npm run dev
```

## Screenshots

Add screenshots of the Servers and Scans screens here to showcase the UI.

## Documentation

- Scanner CLI: [SCANNER_CLI.md](SCANNER_CLI.md)

## Contributing

Contributions are welcome. Please open an issue or PR with a clear description of the change and the motivation.

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.

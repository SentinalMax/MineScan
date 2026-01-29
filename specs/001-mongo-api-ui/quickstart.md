# Quickstart: Scanner Data API and UI

## Prerequisites

- Docker and docker-compose
- Environment variables for existing scanner behavior (optional): `MONGO_URL`, `DISCORD_WEBHOOK`

## Local Dev (planned)

1. Start MongoDB and scanner services:
   - `docker compose up mongo scanner`
2. Start the API service:
   - `docker compose up api`
3. Start the UI container:
   - `docker compose up frontend`

## Expected Endpoints (planned)

- API list endpoint available at `http://localhost:<api-port>/servers`
- UI available at `http://localhost:<frontend-port>`

## Notes

- The UI container communicates with the API container over the docker-compose network.
- The API connects to the existing `mongo` service using `MONGO_URL` (defaults to `mongodb://mongo:27017/mc`).
- The UI supports `/` for the list view and `/servers/{host}` for deep links.

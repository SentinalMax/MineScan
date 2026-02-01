# Research Notes: Scanner Data API and UI

## Decision: Flask for the API layer

**Rationale**: The feature request explicitly calls for a Python Flask API. Flask is lightweight and aligns with the existing Python codebase and deployment model.  
**Alternatives considered**: FastAPI (automatic OpenAPI generation), Bottle (minimal footprint).

## Decision: pymongo for database access

**Rationale**: The current codebase already uses `pymongo` with the MongoDB Server API v1, enabling reuse of connection logic and schemas without introducing a new data layer.  
**Alternatives considered**: Motor (async), MongoEngine (ODM).

## Decision: Vite + React + MUI + styled-components for UI

**Rationale**: The user specified Vite, React, MUI, and optional styled-components. This stack supports rapid iteration and consistent theming for the accordion list UI.  
**Alternatives considered**: CRA (deprecated), Chakra UI, Tailwind.

## Decision: react-router for routing

**Rationale**: A router is needed for future extensibility and clean navigation (list view, detail view, or filtered routes). `react-router` is the standard choice for React SPAs.  
**Alternatives considered**: Reach Router (merged), Next.js routing (different project model).

## Decision: Separate UI container

**Rationale**: The frontend is required to be its own container. This isolates the UI runtime, allows independent build/deploy, and keeps the scanner container focused on scanning.  
**Alternatives considered**: Serve UI from the API container (single container), static hosting outside docker-compose.

## Decision: Default list sorting

**Rationale**: The list should surface the most active servers first to align with operator priorities.  
**Alternatives considered**: Sort by most recent scan or alphabetical name.

## Decision: UI refresh interval

**Rationale**: A 10-second refresh provides near-real-time updates while keeping load reasonable for expected scale.  
**Alternatives considered**: 30-second or 60-second refresh.

## Decision: Routing strategy

**Rationale**: Support both the list at `/` and deep-linkable server routes for direct navigation.  
**Alternatives considered**: Single route only.

## Decision: Missing field display

**Rationale**: Display missing fields as "Unknown" to keep labels consistent and avoid hidden metadata.  
**Alternatives considered**: Hide missing fields or show "N/A".

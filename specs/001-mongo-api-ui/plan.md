# Implementation Plan: Scanner Data API and UI

**Branch**: `001-mongo-api-ui` | **Date**: 2026-01-29 | **Spec**: `specs/001-mongo-api-ui/spec.md`  
**Input**: Feature specification from `/specs/001-mongo-api-ui/spec.md`

## Summary

Deliver a read-only Flask API over existing MongoDB scan data and a separate Vite + React + MUI UI container. The UI lists discovered Minecraft servers, defaults to sorting by active users, refreshes every 10 seconds, supports deep links for server details, and shows full metadata (with missing fields labeled "Unknown") in expanded views only.

## Technical Context

**Language/Version**: Python 3.11 (scanner + API); TypeScript/JavaScript for the Vite React UI  
**Primary Dependencies**: Flask, pymongo, flask-cors; React, Vite, MUI, styled-components, react-router  
**Storage**: MongoDB 7 container (`mongo` service)  
**Testing**: pytest for API; Vitest + React Testing Library for UI  
**Target Platform**: Docker containers on Linux  
**Project Type**: web application (scanner backend + API + frontend UI)  
**Performance Goals**: server list returned within 2 seconds for 1,000 servers; detail fetch under 500 ms  
**Constraints**: read-only access; reuse existing Mongo schema; UI runs in its own container; list refresh every 10 seconds  
**Scale/Scope**: 1,000 servers in list view; single-operator usage; deep links to server details

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code Quality: plan includes modular API + UI structure with lint/format rules.
- Testing: test strategy defined for API and UI primary flows and errors.
- UX Consistency: list/expand UI keeps consistent metadata labels and "Unknown" placeholders.
- Performance: list refresh interval and response targets captured; Mongo query impact documented.

## Project Structure

### Documentation (this feature)

```text
specs/001-mongo-api-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
api/
├── app.py
├── routes/
├── services/
├── models/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   └── services/
└── tests/

scanCore.py
mongoBot.pyw
utils/
```

**Structure Decision**: Add an `api/` Flask module and a `frontend/` Vite app alongside existing scanner scripts. The UI and API run as separate containers and communicate over the docker-compose network.

## Phase 0: Research Summary

- Research outputs captured in `specs/001-mongo-api-ui/research.md`.
- No open clarifications remain.

## Phase 1: Design Summary

- Data model captured in `specs/001-mongo-api-ui/data-model.md`.
- API contracts captured in `specs/001-mongo-api-ui/contracts/openapi.yaml`.
- Quickstart instructions captured in `specs/001-mongo-api-ui/quickstart.md`.

## Post-Design Constitution Check

- Code Quality: Still compliant; architecture is clear and modular.
- Testing: Still compliant; both layers include test coverage requirements.
- UX Consistency: Still compliant; design remains a simple list with expandable details.
- Performance: Still compliant; metrics and refresh interval documented.

## Complexity Tracking

No constitution violations requiring justification.

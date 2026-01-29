# Tasks: Scanner Data API and UI

**Input**: Design documents from `/specs/001-mongo-api-ui/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml

**Tests**: Tests are REQUIRED for new behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create API package layout in `api/` (`api/app.py`, `api/routes/__init__.py`, `api/services/__init__.py`, `api/models/__init__.py`, `api/tests/__init__.py`)
- [x] T002 Initialize Vite React app in `frontend/` with `frontend/package.json`, `frontend/vite.config.ts`, `frontend/src/main.tsx`
- [x] T003 [P] Add UI dependencies (MUI, styled-components, react-router) in `frontend/package.json`
- [X] T004 [P] Add API dependencies (Flask, flask-cors, python-dotenv) in `requirements.txt`
- [x] T005 Update service wiring for UI + API ports in `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T006 Create Flask app configuration and blueprint registration in `api/app.py`
- [X] T007 [P] Add CORS setup and error handlers in `api/app.py`
- [X] T008 [P] Create MongoDB connection helper in `api/services/mongo_client.py`
- [x] T009 [P] Create serializers for ServerSummary/ServerDetail in `api/models/server_serializers.py`
- [X] T010 Create base server routes module in `api/routes/servers.py`
- [X] T011 Create health endpoint in `api/routes/health.py`
- [x] T012 Add UI theme + App shell in `frontend/src/theme/theme.ts` and `frontend/src/App.tsx`
- [x] T013 Add router setup for `/` and `/servers/:host` in `frontend/src/routes/AppRoutes.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Browse discovered servers (Priority: P1) 🎯 MVP

**Goal**: Operators can browse a list of discovered servers sorted by active users and expand entries inline.

**Independent Test**: Open the UI list and verify IP, version, name, and active users render in default order; expanding a server shows extra details.

### Tests for User Story 1 (REQUIRED)

- [x] T014 [P] [US1] API contract test for GET `/servers` default sort in `api/tests/test_servers_list.py`
- [x] T015 [P] [US1] UI test for list rendering + sort order in `frontend/tests/server_list.test.tsx`

### Implementation for User Story 1

- [x] T016 [US1] Implement list query service with default sort (active users desc) in `api/services/server_queries.py`
- [x] T017 [US1] Wire list handler to query service in `api/routes/servers.py`
- [x] T018 [US1] Add API client for list fetch in `frontend/src/services/api.ts`
- [x] T019 [US1] Add list data hook in `frontend/src/services/useServers.ts`
- [x] T020 [US1] Build list page with search + count in `frontend/src/pages/ServersList.tsx`
- [X] T021 [US1] Implement accordion list card in `frontend/src/components/ServerCard.tsx`
- [x] T022 [US1] Add empty/error state components in `frontend/src/components/ServerListState.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - See up-to-date scan results (Priority: P2)

**Goal**: The list stays fresh without manual steps and indicates data recency.

**Independent Test**: Insert a new server record and verify it appears in the UI within the freshness window.

### Tests for User Story 2 (REQUIRED)

- [ ] T023 [P] [US2] API test for recency metadata in `api/tests/test_servers_list_recency.py`
- [ ] T024 [P] [US2] UI test for 10-second auto-refresh in `frontend/tests/refresh.test.tsx`

### Implementation for User Story 2

- [ ] T025 [US2] Include `lastUpdated` metadata in list response in `api/routes/servers.py`
- [ ] T026 [US2] Add 10-second polling/refresh interval in `frontend/src/services/useServers.ts`
- [ ] T027 [US2] Display last updated/stale badge in `frontend/src/components/ServerListHeader.tsx`

**Checkpoint**: User Story 2 is fully functional and testable independently

---

## Phase 5: User Story 3 - Inspect a single server in depth (Priority: P3)

**Goal**: Operators can view all available metadata for a server in the expanded view with missing fields labeled "Unknown".

**Independent Test**: Expand a server entry and verify all available fields render with labels or "Unknown".

### Tests for User Story 3 (REQUIRED)

- [x] T028 [P] [US3] API contract test for GET `/servers/{host}` in `api/tests/test_server_detail.py`
- [x] T029 [P] [US3] UI test for expanded details rendering + Unknown labels in `frontend/tests/server_detail.test.tsx`

### Implementation for User Story 3

- [x] T030 [US3] Implement detail query service in `api/services/server_queries.py`
- [x] T031 [US3] Wire detail handler + extra metadata in `api/routes/servers.py`
- [x] T032 [US3] Render expanded details panel (full player list) in `frontend/src/components/ServerDetails.tsx`
- [x] T033 [US3] Add metadata formatting helpers for Unknown labels in `frontend/src/utils/formatters.ts`

**Checkpoint**: All user stories are functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story improvements and documentation updates

- [ ] T034 [P] Update quickstart with actual ports/commands in `specs/001-mongo-api-ui/quickstart.md`
- [ ] T035 [P] Update `docker-entrypoint.sh` to run scanner + Flask API in one container
- [ ] T036 [P] Document API/UI ports and environment usage in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories
- **US2 (P2)**: Starts after Foundational; independent of US1
- **US3 (P3)**: Starts after Foundational; independent of US1/US2

### Within Each User Story

- Tests MUST be written and fail before implementation
- Services before endpoints
- Core implementation before UI integration

---

## Parallel Example: User Story 1

```bash
Task: "API contract test for GET /servers default sort in api/tests/test_servers_list.py"
Task: "UI test for list rendering + sort order in frontend/tests/server_list.test.tsx"
Task: "Implement list query service with default sort in api/services/server_queries.py"
Task: "Implement accordion list card in frontend/src/components/ServerCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2
2. Complete Phase 3 (User Story 1)
3. Validate the list UI and expand behavior

### Incremental Delivery

1. US1 (browse list) → validate
2. US2 (freshness) → validate
3. US3 (full metadata) → validate

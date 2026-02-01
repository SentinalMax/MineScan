# Feature Specification: Scanner Data API and UI

**Feature Branch**: `001-mongo-api-ui`  
**Created**: 2026-01-29  
**Status**: Draft  
**Input**: User description: "Build a python flask API into the existing backend of this project to communicate with the MongoDB container (after first understanding exactly what the pythonic backend does). Then you'll build an intuative frontend react MUI in tsx and js to interface with that API and retrieve up-to-date data that the scanner finds and puts into MongoDB. Design a simple frontend using React and MUI for displaying discovered minecraft servers. It should be an expandable list of servers with metadata like IP, mc version (e.g, 1.21.11), name, and users active. The user should be able to click to expand on each server to review more granular details. You'll have to also understand how mongodb works in this project and containerized nature of the application."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse discovered servers (Priority: P1)

Operators view a list of discovered Minecraft servers with the headline metadata needed to quickly assess results.

**Why this priority**: This is the primary value of the feature: visibility into discovered servers.

**Independent Test**: Can be fully tested by opening the server list and confirming the headline metadata renders correctly.

**Acceptance Scenarios**:

1. **Given** the data store contains discovered servers, **When** an operator opens the server list, **Then** the list displays each server with IP, version, name, and active user count.
2. **Given** a server entry is visible, **When** the operator expands it, **Then** additional available details are shown without leaving the list view.

---

### User Story 2 - See up-to-date scan results (Priority: P2)

Operators can rely on the list to reflect the latest scan outputs without manual refresh steps.

**Why this priority**: Timely data is essential for the list to be trustworthy.

**Independent Test**: Can be tested by adding a new server record to the data store and observing the UI update.

**Acceptance Scenarios**:

1. **Given** new scan results are stored, **When** the operator is viewing the list, **Then** the new or updated entries appear within the expected freshness window.

---

### User Story 3 - Inspect a single server in depth (Priority: P3)

Operators can review all available details for a specific server to troubleshoot or validate scan output.

**Why this priority**: Detailed inspection supports verification and follow-up actions.

**Independent Test**: Can be tested by expanding one server entry and confirming all available fields are presented clearly.

**Acceptance Scenarios**:

1. **Given** a server has extended data fields, **When** the operator expands the server, **Then** the details show those fields in a readable, labeled format.

---

### Edge Cases

- What happens when there are no discovered servers?
- How does the system handle missing or partial metadata fields?
- What happens when the data store is unavailable or returns errors?
- How does the list behave with a very large number of servers?
- How does the UI indicate stale or delayed data?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a read-only interface to retrieve the current list of discovered servers.
- **FR-002**: System MUST provide access to detailed information for an individual server.
- **FR-003**: The list view MUST display each server's IP, version, name, and active user count when available.
- **FR-004**: Users MUST be able to expand and collapse a server entry to view more granular details inline.
- **FR-005**: System MUST indicate when server data was last updated or scanned.
- **FR-006**: System MUST handle missing or partial data by clearly labeling unavailable fields.
- **FR-007**: The solution MUST integrate with the existing scan data store in the containerized environment without manual data export steps.
- **FR-008**: The UI MUST provide a consistent, simple layout that is easy to scan and supports quick comparisons between servers.
- **FR-009**: The server list MUST default to sorting by active user count (descending).
- **FR-010**: The UI MUST refresh the server list every 10 seconds while the list view is open.
- **FR-011**: The full player list MUST be shown only in the expanded server details view.
- **FR-012**: The UI MUST support both list view at `/` and deep-linkable server detail routes at `/servers/{host}`.
- **FR-013**: Missing metadata fields MUST be displayed as "Unknown".

### Non-Functional Requirements *(mandatory)*

- **NFR-001**: User-facing responses MUST follow existing tone, format, and terminology.
- **NFR-002**: Users MUST be able to load the server list within 2 seconds for up to 1,000 servers under normal conditions.
- **NFR-003**: All new behavior MUST include automated tests for core flows and errors.

### Key Entities *(include if feature involves data)*

- **Server**: Represents a discovered Minecraft server with core metadata (IP, name, version, active users, last updated).
- **Server Detail**: Represents extended server attributes available for inspection (additional metadata, scan timestamps, other discovered fields).
- **Scan Record**: Represents a single scan output associated with a server, including when it was collected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of server list loads display results within 2 seconds for lists up to 1,000 servers.
- **SC-002**: 95% of new scan results appear in the list within 60 seconds of being available in the data store.
- **SC-003**: 90% of test users can find and expand a server entry on their first attempt.
- **SC-004**: 100% of expanded server entries show all available fields with clear labels or "Unknown" placeholders for missing data.

## Clarifications

### Session 2026-01-29

- Q: What should the default list sort be? → A: Default sort by active user count (descending).
- Q: How often should the UI refresh the list by default? → A: Refresh every 10 seconds.
- Q: Where should the player list be shown? → A: Full player list only in expanded details.
- Q: What routing should the UI support? → A: Both `/` list and `/servers/{host}` deep link routes.
- Q: How should missing fields be displayed? → A: Show missing fields as "Unknown".

## Assumptions

- The feature is read-only and does not modify scan data.
- The primary users are internal operators or maintainers.
- The existing scan process continues to populate the data store with server records.
- The frontend UI is deployed as its own container alongside existing services.

## Out of Scope

- Authentication or permission management changes.
- Manual scan triggering or server management actions.
- Editing, deleting, or exporting scan data.

## Dependencies

- Continued availability of the scan data store within the containerized environment.
- Existing scan pipeline continues to populate required fields needed for display.
- Container orchestration supports networking between the UI container and the API surface.

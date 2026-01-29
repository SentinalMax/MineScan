# Data Model: Scanner Data API and UI

## Server

Represents a discovered Minecraft server entry stored in MongoDB.

**Fields**
- `host` (string, required): IP address or host string; unique identifier for list and detail lookups.
- `hostname` (string, optional): Resolved hostname if available.
- `lastOnline` (number, required): Unix timestamp of last successful scan.
- `lastOnlinePlayers` (number, optional): Player count at last scan.
- `lastOnlinePlayersMax` (number, optional): Max player capacity at last scan.
- `lastOnlinePlayersList` (array, optional): List of players observed.
- `lastOnlineVersion` (string, optional): Game version string.
- `lastOnlineVersionProtocol` (string, optional): Protocol version identifier.
- `lastOnlineDescription` (string, optional): MOTD/description string.
- `lastOnlinePing` (number, optional): Latency value captured during scan.
- `cracked` (boolean, optional): Whether the server appears to allow cracked clients.
- `whitelisted` (boolean, optional): Whether the server is whitelisted.
- `favicon` (string, optional): Base64-encoded favicon.

**Validation Rules**
- `host` must be non-empty and unique.
- Numeric counts must be zero or greater.
- `lastOnline` must be a valid Unix timestamp.

## Player

Represents an observed player in the last online player list.

**Fields**
- `name` (string, required): Player name.
- `uuid` (string, optional): Player UUID.

**Validation Rules**
- `name` must be non-empty.

## ServerSummary (API View Model)

Represents the list view response shape.

**Fields**
- `host`, `hostname`, `lastOnline`, `lastOnlinePlayers`, `lastOnlinePlayersMax`, `lastOnlineVersion`, `lastOnlineDescription`, `lastOnlinePing`.

**Notes**
- Fields missing from the source data are surfaced as `null` and labeled as "Unknown" in the UI.

## ServerDetail (API View Model)

Represents the full detail response shape.

**Fields**
- All `Server` fields, including `lastOnlinePlayersList`, `cracked`, `whitelisted`, `favicon`.

**Notes**
- Additional MongoDB fields are surfaced under an `extra` map to ensure the UI can display all metadata the backend can serve.
- Missing detail fields are still shown with the "Unknown" label to preserve consistent layout.

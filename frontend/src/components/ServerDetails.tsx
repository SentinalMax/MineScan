import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { ServerDetail } from '../services/useServerDetail'
import {
  formatBoolean,
  formatExtraValue,
  formatTimestamp,
  formatValue,
} from '../utils/formatters'

type ServerDetailsProps = {
  detail: ServerDetail | null
  loading: boolean
  error: Error | null
}

const ServerDetails = ({ detail, loading, error }: ServerDetailsProps) => {
  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading details...
      </Typography>
    )
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error.message || 'Unable to load server details.'}
      </Typography>
    )
  }

  if (!detail) {
    return (
      <Typography variant="body2" color="text.secondary">
        Expand to load server details.
      </Typography>
    )
  }

  const players = detail.lastOnlinePlayersList ?? []
  const extraEntries = Object.entries(detail.extra ?? {})

  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Server status</Typography>
        <Paper variant="outlined">
          <Box px={2} py={1.5}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Hostname: {formatValue(detail.hostname)}
              </Typography>
              <Typography variant="body2">
                Last online: {formatTimestamp(detail.lastOnline)}
              </Typography>
              <Typography variant="body2">
                Version: {formatValue(detail.lastOnlineVersion)}
              </Typography>
              <Typography variant="body2">
                Protocol: {formatValue(detail.lastOnlineVersionProtocol)}
              </Typography>
              <Typography variant="body2">
                Description: {formatValue(detail.lastOnlineDescription)}
              </Typography>
              <Typography variant="body2">
                Ping: {formatValue(detail.lastOnlinePing, 'Unknown')} ms
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Access</Typography>
        <Paper variant="outlined">
          <Box px={2} py={1.5}>
            <Stack spacing={1}>
              <Typography variant="body2">
                Cracked: {formatBoolean(detail.cracked)}
              </Typography>
              <Typography variant="body2">
                Whitelisted: {formatBoolean(detail.whitelisted)}
              </Typography>
              <Typography variant="body2">
                Player count: {formatValue(detail.lastOnlinePlayers)}
              </Typography>
              <Typography variant="body2">
                Max players: {formatValue(detail.lastOnlinePlayersMax)}
              </Typography>
            </Stack>
          </Box>
        </Paper>
      </Stack>

      <Stack spacing={1}>
        <Typography variant="subtitle2">Players</Typography>
        <Paper variant="outlined">
          <Box px={2} py={1.5}>
            {players.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {players.map((player) => (
                  <Chip
                    key={`${player.name}-${player.uuid ?? 'unknown'}`}
                    label={player.name}
                    size="small"
                  />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {detail.lastOnlinePlayers === null
                  ? 'Unknown'
                  : 'No players reported.'}
              </Typography>
            )}
          </Box>
        </Paper>
      </Stack>

      {extraEntries.length ? (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Extra metadata</Typography>
          <Paper variant="outlined">
            <Box px={2} py={1.5}>
              <Stack spacing={1} divider={<Divider flexItem />}>
                {extraEntries.map(([key, value]) => (
                  <Stack
                    key={key}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                  >
                    <Typography variant="body2">{key}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatExtraValue(value)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
        </Stack>
      ) : null}
    </Stack>
  )
}

export default ServerDetails

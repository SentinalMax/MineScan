import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'
import ServerDetails from './ServerDetails'
import { useServerDetail } from '../services/useServerDetail'
import type { ServerSummary } from '../services/useServers'

type ServerCardProps = {
  server: ServerSummary
}

const formatPlayers = (count: number | null, max: number | null) => {
  if (count === null) {
    return 'Players: Unknown'
  }
  if (max === null) {
    return `Players: ${count}`
  }
  return `Players: ${count} / ${max}`
}

const formatPing = (ping: number | null) => {
  if (ping === null) {
    return 'Ping: Unknown'
  }
  return `Ping: ${ping} ms`
}

const ServerCard = ({ server }: ServerCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const { data, loading, error } = useServerDetail(server.host, expanded)
  const lastOnline =
    server.lastOnline > 0
      ? new Date(server.lastOnline * 1000).toLocaleString()
      : 'Unknown'
  const showHostname =
    server.hostname && server.hostname.trim() !== '' && server.hostname !== server.host

  const handleCopy = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(server.host).catch(() => undefined)
    }
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          width="100%"
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1">{server.host}</Typography>
              <Tooltip title="Copy IP">
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Stack>
            {showHostname ? (
              <Typography variant="body2" color="text.secondary">
                {server.hostname}
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={formatPlayers(
                server.lastOnlinePlayers,
                server.lastOnlinePlayersMax,
              )}
              color="primary"
              size="small"
            />
            <Chip
              label={server.lastOnlineVersion ?? 'Unknown version'}
              variant="outlined"
              size="small"
            />
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography color="text.secondary">
              {server.lastOnlineDescription ?? 'No description available.'}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Typography variant="caption" color="text.secondary">
                Last online: {lastOnline}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPing(server.lastOnlinePing)}
              </Typography>
            </Stack>
          </Stack>
          <ServerDetails detail={data} loading={loading} error={error} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

export default ServerCard

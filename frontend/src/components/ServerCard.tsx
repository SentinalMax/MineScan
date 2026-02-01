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
  const onlineCutoffSeconds = 10 * 60
  const isOnline =
    server.isOnline ??
    (server.lastOnline > 0 &&
      Date.now() - server.lastOnline * 1000 <= onlineCutoffSeconds * 1000)
  const serverName =
    server.hostname && server.hostname.trim() !== ''
      ? server.hostname
      : 'Unknown name'

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
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: isOnline ? 'success.main' : 'error.main',
                }}
              />
              <Typography variant="subtitle1">{server.host}</Typography>
              <Tooltip title="Copy IP">
                <IconButton
                  component="span"
                  size="small"
                  onClick={handleCopy}
                  onMouseDown={(event) => event.stopPropagation()}
                  aria-label="Copy IP"
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {serverName}
            </Typography>
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
            {server.serverType ? (
              <Chip label={server.serverType} variant="outlined" size="small" />
            ) : null}
            {server.whitelisted ? (
              <Chip label="Whitelisted" variant="outlined" size="small" />
            ) : null}
            {server.cracked ? (
              <Chip label="Cracked" variant="outlined" size="small" />
            ) : null}
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

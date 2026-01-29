import {
  Box,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import ServerCard from '../components/ServerCard'
import ServerListState from '../components/ServerListState'
import { useServers } from '../services/useServers'

const ServersList = () => {
  const [query, setQuery] = useState('')
  const { data, error, loading, refresh } = useServers(query)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const trimmedQuery = query.trim()

  const subtitle = useMemo(() => {
    if (trimmedQuery) {
      return `Results for "${trimmedQuery}"`
    }
    return 'Sorted by active players'
  }, [trimmedQuery])

  const countLabel = useMemo(() => {
    if (loading) {
      return 'Loading server count...'
    }
    const suffix = total === 1 ? 'server' : 'servers'
    return `${total} ${suffix}`
  }, [loading, total])

  const isEmpty = !loading && !error && items.length === 0

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Discovered Servers
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Box>
          <TextField
            label="Search"
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by host or name"
          />
        </Stack>

        <Typography variant="subtitle2" color="text.secondary">
          {countLabel}
        </Typography>

        {loading ? (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={20} />
            <Typography color="text.secondary">Loading servers...</Typography>
          </Box>
        ) : null}

        {error && !loading ? (
          <ServerListState
            variant="error"
            title="Unable to load servers"
            description={error.message || 'The server list could not be loaded.'}
            actionLabel="Retry"
            onAction={refresh}
          />
        ) : null}

        {isEmpty ? (
          <ServerListState
            variant="empty"
            title="No servers found"
            description={
              trimmedQuery
                ? 'Try adjusting your search or clear the filter.'
                : 'Run a scan to discover servers and they will appear here.'
            }
          />
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <Stack spacing={2}>
            {items.map((server) => (
              <ServerCard key={server.host} server={server} />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Container>
  )
}

export default ServersList

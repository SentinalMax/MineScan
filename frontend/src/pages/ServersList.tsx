import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useEffect, useMemo, useState } from 'react'
import ServerCard from '../components/ServerCard'
import ServerListState from '../components/ServerListState'
import { useServers } from '../services/useServers'

const SORT_OPTIONS = [
  { value: 'lastOnlinePlayers', label: 'Active players' },
  { value: 'lastOnline', label: 'Last online' },
  { value: 'lastOnlineVersion', label: 'Server version' },
  { value: 'serverType', label: 'Server type' },
  { value: 'whitelisted', label: 'Whitelisted' },
  { value: 'cracked', label: 'Cracked' },
]

const PAGE_SIZE_OPTIONS = [25, 50, 100]

const toUnixSeconds = (value: string) => {
  if (!value) {
    return undefined
  }
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return undefined
  }
  return Math.floor(timestamp / 1000)
}

const parseOptionalInt = (value: string) => {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

const ServersList = () => {
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState('lastOnlinePlayers')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [minPlayers, setMinPlayers] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [lastOnlineAfter, setLastOnlineAfter] = useState('')
  const [lastOnlineBefore, setLastOnlineBefore] = useState('')
  const [version, setVersion] = useState('')
  const [serverType, setServerType] = useState('')
  const [whitelisted, setWhitelisted] = useState<'any' | 'true' | 'false'>('any')
  const [cracked, setCracked] = useState<'any' | 'true' | 'false'>('any')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0])

  const offset = (page - 1) * pageSize

  const { data, error, loading, refresh } = useServers({
    query,
    sort: sortField,
    order: sortOrder,
    minPlayers: parseOptionalInt(minPlayers),
    maxPlayers: parseOptionalInt(maxPlayers),
    lastOnlineAfter: toUnixSeconds(lastOnlineAfter),
    lastOnlineBefore: toUnixSeconds(lastOnlineBefore),
    version,
    serverType,
    whitelisted: whitelisted === 'any' ? undefined : whitelisted === 'true',
    cracked: cracked === 'any' ? undefined : cracked === 'true',
    limit: pageSize,
    offset,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const trimmedQuery = query.trim()
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [
    query,
    sortField,
    sortOrder,
    minPlayers,
    maxPlayers,
    lastOnlineAfter,
    lastOnlineBefore,
    version,
    serverType,
    whitelisted,
    cracked,
    pageSize,
  ])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const activeFilterCount = useMemo(() => {
    const filters = [
      minPlayers,
      maxPlayers,
      lastOnlineAfter,
      lastOnlineBefore,
      version.trim(),
      serverType.trim(),
      whitelisted !== 'any' ? whitelisted : '',
      cracked !== 'any' ? cracked : '',
    ]
    return filters.filter((value) => value !== '').length
  }, [
    minPlayers,
    maxPlayers,
    lastOnlineAfter,
    lastOnlineBefore,
    version,
    serverType,
    whitelisted,
    cracked,
  ])

  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (trimmedQuery) {
      parts.push(`Results for "${trimmedQuery}"`)
    }
    const sortLabel =
      SORT_OPTIONS.find((option) => option.value === sortField)?.label ??
      'Active players'
    parts.push(`Sorted by ${sortLabel} (${sortOrder})`)
    if (activeFilterCount > 0) {
      parts.push(`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''}`)
    }
    return parts.join(' | ')
  }, [trimmedQuery, sortField, sortOrder, activeFilterCount])

  const countLabel = useMemo(() => {
    if (loading) {
      return 'Loading server count...'
    }
    const suffix = total === 1 ? 'server' : 'servers'
    return `${total} ${suffix}`
  }, [loading, total])

  const isEmpty = !loading && !error && items.length === 0
  const showLoadingState = loading && items.length === 0
  return (
    <Stack spacing={3}>
      <Stack spacing={2}>
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              label="Search"
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by host or name"
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="sort-by-label">Sort by</InputLabel>
              <Select
                labelId="sort-by-label"
                label="Sort by"
                value={sortField}
                onChange={(event) => setSortField(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              value={sortOrder}
              exclusive
              size="small"
              onChange={(_, value) => value && setSortOrder(value)}
              aria-label="Sort order"
            >
              <ToggleButton value="desc" aria-label="Descending order">
                Desc
              </ToggleButton>
              <ToggleButton value="asc" aria-label="Ascending order">
                Asc
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </Button>
          </Stack>
        </Stack>

        <Collapse in={showFilters}>
          <Stack
            spacing={2}
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            flexWrap="wrap"
            useFlexGap
          >
            <TextField
              label="Min players"
              size="small"
              value={minPlayers}
              type="number"
              onChange={(event) => setMinPlayers(event.target.value)}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Max players"
              size="small"
              value={maxPlayers}
              type="number"
              onChange={(event) => setMaxPlayers(event.target.value)}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Last online after"
              size="small"
              type="datetime-local"
              value={lastOnlineAfter}
              onChange={(event) => setLastOnlineAfter(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Last online before"
              size="small"
              type="datetime-local"
              value={lastOnlineBefore}
              onChange={(event) => setLastOnlineBefore(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Server version"
              size="small"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
            />
            <TextField
              label="Server type"
              size="small"
              value={serverType}
              onChange={(event) => setServerType(event.target.value)}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="whitelisted-label">Whitelisted</InputLabel>
              <Select
                labelId="whitelisted-label"
                label="Whitelisted"
                value={whitelisted}
                onChange={(event) =>
                  setWhitelisted(event.target.value as 'any' | 'true' | 'false')
                }
              >
                <MenuItem value="any">Any</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="cracked-label">Cracked</InputLabel>
              <Select
                labelId="cracked-label"
                label="Cracked"
                value={cracked}
                onChange={(event) =>
                  setCracked(event.target.value as 'any' | 'true' | 'false')
                }
              >
                <MenuItem value="any">Any</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Collapse>
      </Stack>

        <Typography variant="subtitle2" color="text.secondary">
          {countLabel}
        </Typography>

        {!loading && total > 0 ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="page-size-label">Page size</InputLabel>
              <Select
                labelId="page-size-label"
                label="Page size"
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size} / page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        ) : null}

        {showLoadingState ? (
          <ServerListState
            variant="loading"
            title="Loading servers"
            description="Fetching the latest scan results."
          />
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
  )
}

export default ServersList

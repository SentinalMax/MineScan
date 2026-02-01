import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { ScanRecord } from '../services/scans'
import { formatDurationSeconds, formatTimestamp } from '../utils/formatters'

type ScanCardProps = {
  scan: ScanRecord
  canStop: boolean
  onStop: (scanId: string) => void
  loading: boolean
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running':
      return 'info'
    case 'queued':
      return 'warning'
    case 'stopping':
      return 'warning'
    case 'completed':
      return 'success'
    case 'failed':
      return 'error'
    default:
      return 'default'
  }
}

const formatEta = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) {
    return null
  }
  return formatDurationSeconds(seconds)
}

const ScanCard = ({ scan, canStop, onStop, loading }: ScanCardProps) => {
  const statusColor = getStatusColor(scan.status)
  const subnetsPreview = scan.subnets.slice(0, 3)
  const remainingSubnets = Math.max(scan.subnets.length - subnetsPreview.length, 0)
  const hasProgress =
    typeof scan.hostCount === 'number' &&
    typeof scan.hostsDone === 'number' &&
    scan.hostCount > 0
  const progressValue = hasProgress
    ? Math.min(100, (scan.hostsDone! / scan.hostCount!) * 100)
    : 0

  return (
    <Paper variant="outlined">
      <Box px={2} py={2}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={scan.status} color={statusColor} size="small" />
              <Typography variant="body2" color="text.secondary">
                {scan.scanId}
              </Typography>
            </Stack>
            {canStop ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onStop(scan.scanId)}
                disabled={loading}
              >
                Stop
              </Button>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {subnetsPreview.map((subnet) => (
              <Chip key={subnet} label={subnet} size="small" variant="outlined" />
            ))}
            {remainingSubnets > 0 ? (
              <Chip label={`+${remainingSubnets} more`} size="small" />
            ) : null}
          </Stack>

          {hasProgress ? (
            <Stack spacing={0.5}>
              <LinearProgress variant="determinate" value={progressValue} />
              <Typography variant="caption" color="text.secondary">
                {Math.min(scan.hostsDone!, scan.hostCount!)} / {scan.hostCount} hosts
                scanned
              </Typography>
            </Stack>
          ) : null}

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Created: {formatTimestamp(scan.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Started: {formatTimestamp(scan.startedAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Finished: {formatTimestamp(scan.finishedAt)}
              </Typography>
            </Stack>
            <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Typography variant="caption" color="text.secondary">
                Duration: {formatDurationSeconds(scan.durationSeconds)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Subnets: {scan.subnetsDone ?? 0} / {scan.totalSubnets ?? scan.subnets.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ETA: {formatEta(scan.estimatedSeconds) ?? 'Unknown'}
              </Typography>
            </Stack>
          </Stack>

          {scan.status === 'failed' && scan.error ? (
            <Typography variant="caption" color="error">
              {scan.error}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  )
}

export default ScanCard

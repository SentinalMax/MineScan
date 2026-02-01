import {
  Box,
  Button,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { listScans, startScan, stopScan, type ScanRecord } from '../services/scans'
import ScanCard from '../components/ScanCard'
import ServerListState from '../components/ServerListState'

const parseCsvSubnets = (content: string) =>
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

const ScansPage = () => {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [scanCidr, setScanCidr] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [csvSubnets, setCsvSubnets] = useState<string[]>([])
  const [csvName, setCsvName] = useState<string | null>(null)

  const activeScan = useMemo(
    () =>
      scans.find((scan) =>
        ['queued', 'running', 'stopping'].includes(scan.status),
      ),
    [scans],
  )

  const refreshScans = useCallback(async () => {
    setScanLoading(true)
    try {
      const response = await listScans()
      setScans(response)
      setListError(null)
    } catch (err) {
      setListError('Unable to load scans.')
    } finally {
      setScanLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshScans()
    const interval = setInterval(refreshScans, 5000)
    return () => clearInterval(interval)
  }, [refreshScans])

  const handleStartScan = async () => {
    const trimmed = scanCidr.trim()
    if (!trimmed) {
      setScanError('Enter a subnet CIDR to start a scan.')
      return
    }
    setScanLoading(true)
    try {
      await startScan(trimmed)
      setScanCidr('')
      await refreshScans()
    } catch (err) {
      setScanError('Unable to start scan.')
    } finally {
      setScanLoading(false)
    }
  }

  const handleStopScan = async (scanId: string) => {
    setScanLoading(true)
    try {
      await stopScan(scanId)
      await refreshScans()
    } catch (err) {
      setScanError('Unable to stop scan.')
    } finally {
      setScanLoading(false)
    }
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setCsvName(file.name)
    const text = await file.text()
    const parsed = parseCsvSubnets(text)
    if (parsed.length === 0) {
      setScanError('CSV file is empty or contains no CIDR values.')
      setCsvSubnets([])
      return
    }
    setCsvSubnets(parsed)
    setScanError(null)
  }

  const handleStartCsvScan = async () => {
    if (csvSubnets.length === 0) {
      setScanError('Upload a CSV with CIDR values before starting.')
      return
    }
    setScanLoading(true)
    try {
      await startScan(csvSubnets)
      setCsvSubnets([])
      setCsvName(null)
      await refreshScans()
    } catch (err) {
      setScanError('Unable to start scan from CSV.')
    } finally {
      setScanLoading(false)
    }
  }

  const showLoadingState = scanLoading && scans.length === 0
  const showEmptyState = scans.length === 0 && !scanLoading && !listError

  return (
    <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Scan Settings
          </Typography>
          <Typography color="text.secondary">
            Launch, track, and stop scans. Upload a CSV with one CIDR per line.
          </Typography>
        </Box>

        <Paper variant="outlined">
          <Box px={3} py={2.5}>
            <Stack spacing={2}>
              <Typography variant="h6">Start a scan</Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <TextField
                  label="Subnet CIDR"
                  size="small"
                  value={scanCidr}
                  onChange={(event) => setScanCidr(event.target.value)}
                  placeholder="e.g. 192.168.0.0/24"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleStartScan}
                  disabled={scanLoading}
                >
                  Start scan
                </Button>
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle2">Upload CSV</Typography>
                <Button variant="outlined" component="label">
                  Choose CSV file
                  <input
                    type="file"
                    hidden
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                  />
                </Button>
                {csvName ? (
                  <Typography variant="caption" color="text.secondary">
                    {csvName} · {csvSubnets.length} subnets
                  </Typography>
                ) : null}
                <Button
                  variant="contained"
                  onClick={handleStartCsvScan}
                  disabled={scanLoading || csvSubnets.length === 0}
                >
                  Start CSV scan
                </Button>
              </Stack>

              {scanError ? (
                <Typography color="error" variant="body2">
                  {scanError}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Paper>

        <Paper variant="outlined">
          <Box px={3} py={2.5}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Recent scans</Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={refreshScans}
                  disabled={scanLoading}
                >
                  Refresh
                </Button>
              </Stack>
              {showLoadingState ? (
                <ServerListState
                  variant="loading"
                  title="Loading scans"
                  description="Fetching the latest scan updates."
                />
              ) : null}
              {listError ? (
                <ServerListState
                  variant="error"
                  title="Unable to load scans"
                  description={listError}
                  actionLabel="Retry"
                  onAction={refreshScans}
                />
              ) : null}
              {showEmptyState ? (
                <ServerListState
                  variant="empty"
                  title="No scans started yet"
                  description="Start a scan above and it will appear here."
                />
              ) : null}
              {scans.map((scan) => (
                <ScanCard
                  key={scan.scanId}
                  scan={scan}
                  canStop={['queued', 'running', 'stopping'].includes(scan.status)}
                  onStop={handleStopScan}
                  loading={scanLoading}
                />
              ))}
              {activeScan ? (
                <Typography variant="caption" color="text.secondary">
                  Active scan: {activeScan.scanId}
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Paper>
    </Stack>
  )
}

export default ScansPage

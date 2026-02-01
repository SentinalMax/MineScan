import { fetchJson } from './api'

export type ScanRecord = {
  scanId: string
  subnets: string[]
  status: string
  createdAt?: number
  startedAt?: number
  finishedAt?: number
  durationSeconds?: number
  error?: string
  hostCount?: number
  hostsDone?: number
  subnetsDone?: number
  totalSubnets?: number
  estimatedSeconds?: number | null
}

export const listScans = async () => {
  const response = await fetchJson<{ items: ScanRecord[] }>('/scans')
  return response.items
}

export const startScan = async (payload: string | string[]) =>
  fetchJson<ScanRecord>('/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      Array.isArray(payload) ? { subnets: payload } : { subnetCidr: payload },
    ),
  })

export const stopScan = async (scanId: string) =>
  fetchJson<{ status: string }>(`/scans/${scanId}/stop`, {
    method: 'POST',
  })

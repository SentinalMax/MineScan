import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchJson } from './api'

export type ServerSummary = {
  host: string
  hostname: string | null
  lastOnline: number
  lastOnlinePlayers: number | null
  lastOnlinePlayersMax: number | null
  lastOnlineVersion: string | null
  lastOnlineDescription: string | null
  lastOnlinePing: number | null
  serverType?: string | null
  whitelisted?: boolean | null
  cracked?: boolean | null
  isOnline?: boolean
}

type ServerListResponse = {
  total: number
  items: ServerSummary[]
}

export type ServersState = {
  data: ServerListResponse | null
  loading: boolean
  error: Error | null
  refresh: () => void
}

export type ServerListParams = {
  query: string
  sort: string
  order: 'asc' | 'desc'
  minPlayers?: number
  maxPlayers?: number
  lastOnlineAfter?: number
  lastOnlineBefore?: number
  version?: string
  serverType?: string
  whitelisted?: boolean
  cracked?: boolean
}

const getErrorMessage = (error: Error) => {
  if (error instanceof ApiError && error.status === 404) {
    return 'Servers endpoint was not found.'
  }
  return error.message || 'Unable to load servers.'
}

export const useServers = ({
  query,
  sort,
  order,
  minPlayers,
  maxPlayers,
  lastOnlineAfter,
  lastOnlineBefore,
  version,
  serverType,
  whitelisted,
  cracked,
}: ServerListParams): ServersState => {
  const [data, setData] = useState<ServerListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [requestId, setRequestId] = useState(0)

  const refresh = useCallback(() => {
    setRequestId((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetchJson<ServerListResponse>('/servers', {
          params: {
            q: query.trim(),
            sort,
            order,
            minPlayers,
            maxPlayers,
            lastOnlineAfter,
            lastOnlineBefore,
            version: version?.trim(),
            serverType: serverType?.trim(),
            whitelisted,
            cracked,
          },
          signal: controller.signal,
        })

        if (active) {
          setData(response)
        }
      } catch (err) {
        if (!active) {
          return
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const normalized =
          err instanceof Error ? err : new Error('Unable to load servers.')
        normalized.message = getErrorMessage(normalized)
        setError(normalized)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [
    query,
    sort,
    order,
    minPlayers,
    maxPlayers,
    lastOnlineAfter,
    lastOnlineBefore,
    version,
    serverType,
    whitelisted,
    cracked,
    requestId,
  ])

  return { data, loading, error, refresh }
}

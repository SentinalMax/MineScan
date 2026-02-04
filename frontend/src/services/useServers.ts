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

type ServerStatusResponse = {
  statuses: Record<string, boolean>
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
  limit?: number
  offset?: number
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
  limit,
  offset,
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
            limit,
            offset,
          },
          signal: controller.signal,
        })

        if (active) {
          setData(response)
        }

        const hosts = response.items.map((item) => item.host).filter(Boolean)
        if (hosts.length > 0) {
          void (async () => {
            try {
              const statusResponse = await fetchJson<ServerStatusResponse>(
                '/servers/status',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ hosts }),
                  signal: controller.signal,
                },
              )
              if (!active) {
                return
              }
              setData((prev) => {
                if (!prev) {
                  return prev
                }
                const updatedItems = prev.items.map((item) => ({
                  ...item,
                  isOnline: statusResponse.statuses[item.host],
                }))
                return { ...prev, items: updatedItems }
              })
            } catch (statusError) {
              if (
                statusError instanceof DOMException &&
                statusError.name === 'AbortError'
              ) {
                return
              }
            }
          })()
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
    limit,
    offset,
    requestId,
  ])

  return { data, loading, error, refresh }
}

import { useEffect, useMemo, useState } from 'react'
import { ApiError, fetchJson } from './api'

export type ServerDetail = {
  host: string
  hostname: string | null
  lastOnline: number | null
  lastOnlinePlayers: number | null
  lastOnlinePlayersMax: number | null
  lastOnlinePlayersList: Array<{ name: string; uuid: string | null }>
  lastOnlineVersion: string | null
  lastOnlineVersionProtocol: string | null
  lastOnlineDescription: string | null
  lastOnlinePing: number | null
  cracked: boolean | null
  whitelisted: boolean | null
  favicon: string | null
  extra: Record<string, unknown>
}

type ServerDetailState = {
  data: ServerDetail | null
  loading: boolean
  error: Error | null
}

const getErrorMessage = (error: Error) => {
  if (error instanceof ApiError && error.status === 404) {
    return 'Server details were not found.'
  }
  return error.message || 'Unable to load server details.'
}

export const useServerDetail = (
  host: string,
  enabled: boolean,
): ServerDetailState => {
  const [data, setData] = useState<ServerDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const endpoint = useMemo(
    () => `/servers/${encodeURIComponent(host)}`,
    [host],
  )

  useEffect(() => {
    if (!enabled || !host) {
      return
    }

    let active = true
    const controller = new AbortController()

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetchJson<ServerDetail>(endpoint, {
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
          err instanceof Error ? err : new Error('Unable to load server details.')
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
  }, [endpoint, enabled, host])

  return { data, loading, error }
}

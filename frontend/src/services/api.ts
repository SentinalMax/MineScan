const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const buildApiUrl = (
  path: string,
  params?: Record<string, string | number | undefined>,
) => {
  const url = new URL(path, API_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

export const fetchJson = async <T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> },
) => {
  const url = buildApiUrl(path, options?.params)
  const response = await fetch(url, options)

  if (!response.ok) {
    const message = `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return (await response.json()) as T
}

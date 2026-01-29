export const formatValue = (
  value: string | number | null | undefined,
  fallback = 'Unknown',
) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  return String(value)
}

export const formatBoolean = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    return 'Unknown'
  }
  return value ? 'Yes' : 'No'
}

export const formatTimestamp = (value: number | null | undefined) => {
  if (!value) {
    return 'Unknown'
  }
  const date = new Date(value * 1000)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }
  return date.toLocaleString()
}

export const formatExtraValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return 'Unknown'
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

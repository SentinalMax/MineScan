import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ServersList from '../src/pages/ServersList'

const createResponse = (data: unknown) => ({
  ok: true,
  json: async () => data,
})

describe('ServersList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders servers in provided order and shows count', async () => {
    const data = {
      total: 2,
      items: [
        {
          host: '203.0.113.2',
          hostname: 'beta.example.com',
          lastOnline: 1700000000,
          lastOnlinePlayers: 10,
          lastOnlinePlayersMax: 100,
          lastOnlineVersion: '1.20.4',
          lastOnlineDescription: 'Beta server',
          lastOnlinePing: 42,
        },
        {
          host: '203.0.113.1',
          hostname: 'alpha.example.com',
          lastOnline: 1700000001,
          lastOnlinePlayers: 5,
          lastOnlinePlayersMax: 50,
          lastOnlineVersion: '1.20.1',
          lastOnlineDescription: 'Alpha server',
          lastOnlinePing: 31,
        },
      ],
    }

    const fetchMock = vi.fn().mockResolvedValue(createResponse(data))
    vi.stubGlobal('fetch', fetchMock)

    const { container } = render(<ServersList />)

    expect(await screen.findByText('2 servers')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('203.0.113.2')).toBeInTheDocument()
      expect(screen.getByText('203.0.113.1')).toBeInTheDocument()
    })

    const content = container.textContent ?? ''
    const firstIndex = content.indexOf('203.0.113.2')
    const secondIndex = content.indexOf('203.0.113.1')
    expect(firstIndex).toBeLessThan(secondIndex)
  })
})

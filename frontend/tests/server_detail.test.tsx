import { render, screen } from '@testing-library/react'
import ServerDetails from '../src/components/ServerDetails'
import type { ServerDetail } from '../src/services/useServerDetail'

const sampleDetail: ServerDetail = {
  host: '203.0.113.8',
  hostname: null,
  lastOnline: 1700000000,
  lastOnlinePlayers: null,
  lastOnlinePlayersMax: null,
  lastOnlinePlayersList: [{ name: 'Steve', uuid: null }],
  lastOnlineVersion: null,
  lastOnlineVersionProtocol: null,
  lastOnlineDescription: null,
  lastOnlinePing: null,
  cracked: null,
  whitelisted: null,
  favicon: null,
  extra: { region: 'eu-west' },
}

describe('ServerDetails', () => {
  it('renders unknown labels for missing values', () => {
    render(<ServerDetails detail={sampleDetail} loading={false} error={null} />)

    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('Steve')).toBeInTheDocument()
    expect(screen.getByText('eu-west')).toBeInTheDocument()
  })
})

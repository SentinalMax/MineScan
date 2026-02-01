import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useMatch } from 'react-router-dom'

type AppLayoutProps = {
  children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation()
  const detailMatch = useMatch('/servers/:host')
  const isServers = location.pathname === '/' || Boolean(detailMatch)
  const isScans = location.pathname.startsWith('/scans')

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: 'absolute',
          left: 16,
          top: -48,
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          zIndex: 1201,
          '&:focus-visible': {
            top: 16,
          },
        }}
      >
        Skip to content
      </Box>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar>
          <Container
            maxWidth="lg"
            sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}
          >
            <Typography variant="h6">MineScan UI</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexGrow={1}>
              <Button
                component={RouterLink}
                to="/"
                variant={isServers ? 'contained' : 'text'}
                aria-current={isServers ? 'page' : undefined}
              >
                Servers
              </Button>
              <Button
                component={RouterLink}
                to="/scans"
                variant={isScans ? 'contained' : 'text'}
                aria-current={isScans ? 'page' : undefined}
              >
                Scans
              </Button>
            </Stack>
            {detailMatch ? (
              <Typography variant="body2" color="text.secondary">
                Server {detailMatch.params.host}
              </Typography>
            ) : null}
          </Container>
        </Toolbar>
      </AppBar>
      <Container id="main-content" tabIndex={-1} maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}

export default AppLayout

import { Container, Typography } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ScansPage from '../pages/ScansPage'
import ServersList from '../pages/ServersList'

const ServerDetailPlaceholder = () => (
  <Container sx={{ py: 4 }}>
    <Typography variant="h4" gutterBottom>
      Server Details
    </Typography>
    <Typography color="text.secondary">
      Detailed server view will render here.
    </Typography>
  </Container>
)

const AppRoutes = () => (
  <BrowserRouter>
    <AppLayout>
      <Routes>
        <Route path="/" element={<ServersList />} />
        <Route path="/scans" element={<ScansPage />} />
        <Route path="/servers/:host" element={<ServerDetailPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  </BrowserRouter>
)

export default AppRoutes

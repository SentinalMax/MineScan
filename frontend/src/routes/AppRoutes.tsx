import { Box, Container, Typography } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
    <Box minHeight="100vh" bgcolor="background.default">
      <Routes>
        <Route path="/" element={<ServersList />} />
        <Route path="/servers/:host" element={<ServerDetailPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  </BrowserRouter>
)

export default AppRoutes

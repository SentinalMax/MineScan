import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'

type ServerListStateProps = {
  variant: 'empty' | 'error' | 'loading'
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

const ServerListState = ({
  variant,
  title,
  description,
  actionLabel,
  onAction,
}: ServerListStateProps) => (
  <Paper variant="outlined">
    <Box px={3} py={4}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        {variant === 'loading' ? <CircularProgress size={24} /> : null}
        <Typography variant="h6">{title}</Typography>
        {description ? (
          <Typography color="text.secondary">{description}</Typography>
        ) : null}
        {variant === 'error' && actionLabel && onAction ? (
          <Button variant="contained" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  </Paper>
)

export default ServerListState

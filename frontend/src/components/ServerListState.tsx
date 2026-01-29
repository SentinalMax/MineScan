import { Box, Button, Paper, Stack, Typography } from '@mui/material'

type ServerListStateProps = {
  variant: 'empty' | 'error'
  title: string
  description: string
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
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
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

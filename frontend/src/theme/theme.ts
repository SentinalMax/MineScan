import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#0f1214',
      paper: '#141a1d',
    },
  },
  typography: {
    fontFamily: ['"Inter"', '"Segoe UI"', 'Roboto', 'Arial', 'sans-serif'].join(','),
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
  },
})

export default theme

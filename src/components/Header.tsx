import React, { useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AutoAwesome,
  GitHub,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { ColorModeContext } from '../App';

const Header: React.FC = () => {
  const colorMode = useContext(ColorModeContext);

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AutoAwesome sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold' }}
            >
              AI Humanizer
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label="v1.0.0" 
              size="small" 
              color="secondary" 
              variant="outlined"
              sx={{ 
                color: 'inherit', 
                borderColor: 'inherit',
                display: { xs: 'none', sm: 'flex' }
              }}
            />
            
            {/* Dark/Light Mode Toggle */}
            <Tooltip title={colorMode?.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton 
                onClick={colorMode?.toggleColorMode}
                color="inherit"
                sx={{ 
                  bgcolor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: colorMode?.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                }}
              >
                {colorMode?.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>

            <Button 
              color="inherit" 
              startIcon={<GitHub />}
              href="https://github.com/yourusername/ai-humanizer"
              target="_blank"
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              GitHub
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
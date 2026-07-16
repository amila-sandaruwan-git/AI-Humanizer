import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Chip,
} from '@mui/material';
import { AutoAwesome, GitHub } from '@mui/icons-material';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <AutoAwesome sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 'bold' }}
          >
            AI Humanizer
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label="v1.0.0" 
              size="small" 
              color="secondary" 
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
            />
            <Button 
              color="inherit" 
              startIcon={<GitHub />}
              href="https://github.com/yourusername/ai-humanizer"
              target="_blank"
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
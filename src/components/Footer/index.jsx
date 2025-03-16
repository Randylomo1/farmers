import { Box, Container, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'primary.main', color: 'white' }}>
      <Container maxWidth="lg">
        <Typography variant="body1" align="center">
          © {new Date().getFullYear()} AgriConnect. All rights reserved.
        </Typography>
        <Typography variant="body2" align="center">
          <Link color="inherit" href="/privacy-policy">
            Privacy Policy
          </Link>
          {' | '}
          <Link color="inherit" href="/terms-of-service">
            Terms of Service
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
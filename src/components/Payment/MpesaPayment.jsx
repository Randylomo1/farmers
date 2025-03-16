import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import { initiatePayment, checkPaymentStatus } from '../../store/slices/mpesaSlice';

const MpesaPayment = ({ amount, onPaymentComplete }) => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  
  const { isLoading, error, checkoutRequestID, transactionStatus } = useSelector(
    (state) => state.mpesa
  );

  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  useEffect(() => {
    if (checkoutRequestID) {
      const interval = setInterval(() => {
        dispatch(checkPaymentStatus(checkoutRequestID));
      }, 5000);
      setStatusCheckInterval(interval);

      return () => clearInterval(interval);
    }
  }, [checkoutRequestID, dispatch]);

  useEffect(() => {
    if (transactionStatus === 'The service request is processed successfully.') {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      onPaymentComplete(true);
    }
  }, [transactionStatus, statusCheckInterval, onPaymentComplete]);

  const handlePayment = async () => {
    if (!phoneNumber) {
      return;
    }

    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : `254${phoneNumber.replace(/^0+/, '')}`;

    await dispatch(initiatePayment({
      phoneNumber: formattedPhone,
      amount,
      accountReference: 'AgriConnect Purchase'
    }));
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        M-Pesa Payment
      </Typography>
      
      <TextField
        fullWidth
        label="Phone Number"
        variant="outlined"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="e.g., 254712345678"
        margin="normal"
        disabled={isLoading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {transactionStatus && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {transactionStatus}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handlePayment}
        disabled={isLoading || !phoneNumber}
        sx={{ mt: 3 }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `Pay KES ${amount}`
        )}
      </Button>
    </Box>
  );
};

export default MpesaPayment;
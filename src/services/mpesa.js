import axios from 'axios';

const MPESA_API_URL = import.meta.env.VITE_MPESA_API_URL;
const CONSUMER_KEY = import.meta.env.VITE_MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = import.meta.env.VITE_MPESA_CONSUMER_SECRET;
const BUSINESS_SHORT_CODE = import.meta.env.VITE_MPESA_BUSINESS_SHORT_CODE;
const PASSKEY = import.meta.env.VITE_MPESA_PASSKEY;
const CALLBACK_URL = import.meta.env.VITE_MPESA_CALLBACK_URL;

// Generate Base64 auth token
const getAuthToken = async () => {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const response = await axios.get(`${MPESA_API_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating auth token:', error);
    throw new Error('Failed to generate auth token');
  }
};

// Generate password for STK Push
const generatePassword = () => {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(
    `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`
  ).toString('base64');
  return { password, timestamp };
};

// Initiate STK Push
export const initiateSTKPush = async ({ phoneNumber, amount, accountReference }) => {
  try {
    const token = await getAuthToken();
    const { password, timestamp } = generatePassword();

    const response = await axios.post(
      `${MPESA_API_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: BUSINESS_SHORT_CODE,
        PhoneNumber: phoneNumber,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: 'Payment for AgriConnect purchase',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error initiating STK push:', error);
    throw new Error('Failed to initiate payment');
  }
};

// Query STK Push Status
export const querySTKStatus = async (checkoutRequestID) => {
  try {
    const token = await getAuthToken();
    const { password, timestamp } = generatePassword();

    const response = await axios.post(
      `${MPESA_API_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: BUSINESS_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error querying STK status:', error);
    throw new Error('Failed to query payment status');
  }
};
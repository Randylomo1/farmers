import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { initiateSTKPush, querySTKStatus } from '../../services/mpesa';

export const initiatePayment = createAsyncThunk(
  'mpesa/initiatePayment',
  async ({ phoneNumber, amount, accountReference }, { rejectWithValue }) => {
    try {
      const response = await initiateSTKPush({ phoneNumber, amount, accountReference });
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkPaymentStatus = createAsyncThunk(
  'mpesa/checkStatus',
  async (checkoutRequestID, { rejectWithValue }) => {
    try {
      const response = await querySTKStatus(checkoutRequestID);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  isLoading: false,
  error: null,
  checkoutRequestID: null,
  transactionStatus: null,
  lastPaymentDetails: null
};

const mpesaSlice = createSlice({
  name: 'mpesa',
  initialState,
  reducers: {
    resetPaymentState: (state) => {
      state.error = null;
      state.checkoutRequestID = null;
      state.transactionStatus = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initiatePayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutRequestID = action.payload.CheckoutRequestID;
        state.lastPaymentDetails = action.payload;
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(checkPaymentStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactionStatus = action.payload.ResultDesc;
      })
      .addCase(checkPaymentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetPaymentState } = mpesaSlice.actions;
export default mpesaSlice.reducer;
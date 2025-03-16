import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...orderData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status, trackingInfo }, { rejectWithValue }) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates = {
        status,
        updatedAt: new Date().toISOString(),
        ...(trackingInfo && { trackingInfo })
      };
      await updateDoc(orderRef, updates);
      return { id: orderId, ...updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const ordersRef = collection(db, 'orders');
      let q = ordersRef;

      if (role === 'farmer') {
        q = query(q, where('farmerId', '==', userId));
      } else if (role === 'buyer') {
        q = query(q, where('buyerId', '==', userId));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  orders: [],
  activeOrders: [],
  completedOrders: [],
  loading: false,
  error: null
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    filterOrders: (state) => {
      state.activeOrders = state.orders.filter(order => 
        ['pending', 'processing', 'shipped'].includes(order.status)
      );
      state.completedOrders = state.orders.filter(order => 
        ['delivered', 'cancelled'].includes(order.status)
      );
    },
    clearOrderError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders.push(action.payload);
        state.activeOrders.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], ...action.payload };
        }
      })
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
        state.activeOrders = action.payload.filter(order => 
          ['pending', 'processing', 'shipped'].includes(order.status)
        );
        state.completedOrders = action.payload.filter(order => 
          ['delivered', 'cancelled'].includes(order.status)
        );
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { filterOrders, clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;
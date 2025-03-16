import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  createSupportTicket,
  updateTicketStatus,
  addTicketMessage,
  fetchUserTickets,
  fetchAllTickets
} from '../../services/support';

export const createTicket = createAsyncThunk(
  'support/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      return await createSupportTicket(ticketData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStatus = createAsyncThunk(
  'support/updateStatus',
  async ({ ticketId, status }, { rejectWithValue }) => {
    try {
      return await updateTicketStatus(ticketId, status);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addMessage = createAsyncThunk(
  'support/addMessage',
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      return await addTicketMessage(ticketId, message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getUserTickets = createAsyncThunk(
  'support/getUserTickets',
  async (userId, { rejectWithValue }) => {
    try {
      return await fetchUserTickets(userId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getAllTickets = createAsyncThunk(
  'support/getAllTickets',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllTickets();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  tickets: [],
  activeTicket: null,
  isLoading: false,
  error: null
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    setActiveTicket: (state, action) => {
      state.activeTicket = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTicket.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets.unshift(action.payload);
        state.activeTicket = action.payload;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = { ...state.tickets[index], ...action.payload };
          if (state.activeTicket?.id === action.payload.id) {
            state.activeTicket = { ...state.activeTicket, ...action.payload };
          }
        }
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.ticketId);
        if (index !== -1) {
          state.tickets[index].messages = action.payload.message;
          if (state.activeTicket?.id === action.payload.ticketId) {
            state.activeTicket.messages = action.payload.message;
          }
        }
      })
      .addCase(getUserTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload;
      })
      .addCase(getUserTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getAllTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tickets = action.payload;
      })
      .addCase(getAllTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setActiveTicket, clearError } = supportSlice.actions;
export default supportSlice.reducer;
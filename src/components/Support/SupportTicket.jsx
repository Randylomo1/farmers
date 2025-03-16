import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  createTicket,
  addMessage,
  updateStatus,
  getUserTickets
} from '../../store/slices/supportSlice';

const SupportTicket = ({ userId }) => {
  const dispatch = useDispatch();
  const { tickets, activeTicket, isLoading, error } = useSelector((state) => state.support);
  
  const [newMessage, setNewMessage] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (userId) {
      dispatch(getUserTickets(userId));
    }
  }, [dispatch, userId]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    await dispatch(createTicket({
      ...newTicket,
      userId,
      createdAt: new Date().toISOString()
    }));
    setNewTicket({ subject: '', description: '', priority: 'medium' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeTicket) return;

    await dispatch(addMessage({
      ticketId: activeTicket.id,
      message: {
        text: newMessage,
        userId,
        timestamp: new Date().toISOString()
      }
    }));
    setNewMessage('');
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    await dispatch(updateStatus({ ticketId, status: newStatus }));
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      {/* Ticket List */}
      <Paper sx={{ width: '30%', p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Support Tickets
        </Typography>
        
        {/* Create New Ticket Form */}
        <Box component="form" onSubmit={handleCreateTicket} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Subject"
            value={newTicket.subject}
            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTicket.priority}
              onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
          >
            Create Ticket
          </Button>
        </Box>

        <List>
          {tickets.map((ticket) => (
            <ListItem
              key={ticket.id}
              button
              selected={activeTicket?.id === ticket.id}
              onClick={() => dispatch({ type: 'support/setActiveTicket', payload: ticket })}
            >
              <ListItemText
                primary={ticket.subject}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      Status: {ticket.status}
                    </Typography>
                    <br />
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Active Ticket Chat */}
      <Paper sx={{ width: '70%', p: 2 }}>
        {activeTicket ? (
          <>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{activeTicket.subject}</Typography>
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  size="small"
                  value={activeTicket.status}
                  onChange={(e) => handleStatusUpdate(activeTicket.id, e.target.value)}
                >
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ height: '400px', overflowY: 'auto', mb: 2 }}>
              {activeTicket.messages?.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1,
                    p: 1,
                    backgroundColor: msg.userId === userId ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: 1,
                    maxWidth: '80%',
                    ml: msg.userId === userId ? 'auto' : 0
                  }}
                >
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(msg.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box component="form" onSubmit={handleSendMessage}>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!newMessage.trim()}
              >
                Send Message
              </Button>
            </Box>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">
            Select a ticket to view the conversation
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default SupportTicket;
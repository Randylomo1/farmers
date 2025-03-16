import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';

// Create a new support ticket
export const createSupportTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(collection(db, 'supportTickets'), {
      ...ticketData,
      status: 'open',
      priority: ticketData.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    });
    return { id: docRef.id, ...ticketData };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw new Error('Failed to create support ticket');
  }
};

// Update ticket status
export const updateTicketStatus = async (ticketId, status) => {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return { id: ticketId, status };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw new Error('Failed to update ticket status');
  }
};

// Add message to ticket
export const addTicketMessage = async (ticketId, message) => {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
      messages: [...message],
      updatedAt: new Date().toISOString()
    });
    return { ticketId, message };
  } catch (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }
};

// Fetch user tickets
export const fetchUserTickets = async (userId) => {
  try {
    const ticketsRef = collection(db, 'supportTickets');
    const q = query(
      ticketsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw new Error('Failed to fetch tickets');
  }
};

// Fetch all tickets (for admin/support staff)
export const fetchAllTickets = async () => {
  try {
    const ticketsRef = collection(db, 'supportTickets');
    const q = query(ticketsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    throw new Error('Failed to fetch tickets');
  }
};
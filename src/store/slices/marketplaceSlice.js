import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../config/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';

export const fetchProducts = createAsyncThunk(
  'marketplace/fetchProducts',
  async (filters, { rejectWithValue }) => {
    try {
      const productsRef = collection(db, 'products');
      let q = productsRef;
      
      if (filters) {
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }
        if (filters.farmerId) {
          q = query(q, where('farmerId', '==', filters.farmerId));
        }
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addProduct = createAsyncThunk(
  'marketplace/addProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        createdAt: new Date().toISOString(),
        status: 'active'
      });
      return { id: docRef.id, ...productData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'marketplace/updateProduct',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, updates);
      return { id, ...updates };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  filteredProducts: [],
  loading: false,
  error: null,
  filters: {
    category: null,
    priceRange: null,
    sortBy: null
  }
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredProducts = state.products;
    },
    applyFilters: (state) => {
      let filtered = [...state.products];
      
      if (state.filters.category) {
        filtered = filtered.filter(product => 
          product.category === state.filters.category
        );
      }
      
      if (state.filters.priceRange) {
        const [min, max] = state.filters.priceRange;
        filtered = filtered.filter(product => 
          product.price >= min && product.price <= max
        );
      }
      
      if (state.filters.sortBy) {
        filtered.sort((a, b) => {
          switch (state.filters.sortBy) {
            case 'price-asc':
              return a.price - b.price;
            case 'price-desc':
              return b.price - a.price;
            case 'date-newest':
              return new Date(b.createdAt) - new Date(a.createdAt);
            default:
              return 0;
          }
        });
      }
      
      state.filteredProducts = filtered;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
        state.filteredProducts = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
        state.filteredProducts = state.products;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = { ...state.products[index], ...action.payload };
          state.filteredProducts = state.products;
        }
      });
  }
});

export const { setFilters, clearFilters, applyFilters } = marketplaceSlice.actions;
export default marketplaceSlice.reducer;
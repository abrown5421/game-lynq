// authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types/user.types';
import { authApi } from '../../app/store/api/authApi';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<IUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload;  
        state.isAuthenticated = true;
      }
    );
    
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, { payload }) => {
        state.user = payload;  
        state.isAuthenticated = true;
      }
    );
    
    builder.addMatcher(
      authApi.endpoints.logout.matchFulfilled,
      (state) => {
        state.user = null;
        state.isAuthenticated = false;
      }
    );
    
    builder.addMatcher(
      authApi.endpoints.getCurrentUser.matchFulfilled,
      (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = true;
      }
    );
    
    builder.addMatcher(
      authApi.endpoints.getCurrentUser.matchRejected,
      (state) => {
        state.user = null;
        state.isAuthenticated = false;
      }
    );
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
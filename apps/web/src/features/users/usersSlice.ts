import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../../types/user.types';

interface UsersState {
  selectedUser: IUser | null;
  filters: {
    type?: 'user' | 'editor' | 'admin';
    search?: string;
  };
}

const initialState: UsersState = {
  selectedUser: null,
  filters: {},
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSelectedUser: (state, action: PayloadAction<IUser | null>) => {
      state.selectedUser = action.payload;
    },
    setFilters: (state, action: PayloadAction<UsersState['filters']>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const { setSelectedUser, setFilters, clearFilters } = usersSlice.actions;
export default usersSlice.reducer;
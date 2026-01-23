import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DrawerProps } from './drawerTypes';

const initialState: DrawerProps = {
  open: false,
  drawerContent: '',
  anchor: 'right',
  title: ''
};

const drawerSlice = createSlice({
  name: 'drawer',
  initialState,
  reducers: {
    openDrawer: (state, action: PayloadAction<DrawerProps>) => {
      state.open = true;
      state.drawerContent = action.payload.drawerContent;
      state.anchor = action.payload.anchor;
      state.title = action.payload.title
    },
    closeDrawer: (state) => {
      state.open = false;
    },
    resetDrawer: () => initialState,
  },
});

export const { openDrawer, closeDrawer, resetDrawer } = drawerSlice.actions;
export default drawerSlice.reducer;

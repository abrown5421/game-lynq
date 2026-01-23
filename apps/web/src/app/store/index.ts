import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './api/baseApi';
import authReducer from '../../features/auth/authSlice';
import usersReducer from '../../features/users/usersSlice';
import alertReducer from '../../features/alert/alertSlice';
import drawerReducer from '../../features/drawer/drawerSlice';
import modalReducer from '../../features/modal/modalSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    users: usersReducer,
    alert: alertReducer,
    drawer: drawerReducer,
    modal: modalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { AuthResponse, LoginRequest, RegisterRequest } from '../../../types/api.types';
import { IUser } from '../../../types/user.types';
import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    getCurrentUser: builder.query<IUser, void>({
      query: () => '/auth/me',
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
} = authApi;
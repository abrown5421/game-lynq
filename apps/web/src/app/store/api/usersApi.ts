import { CreateUserDto, IUser, UpdateUserDto } from '../../../types/user.types';
import { baseApi } from './baseApi';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<IUser[], void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'User' as const, id: _id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query<IUser, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    getEditorsAndAdmins: builder.query<IUser[], void>({
      query: () => ({
        url: '/users',
        params: {
          type: ['admin', 'editor'], 
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'User' as const, id: _id })),
              { type: 'User', id: 'EDITOR_ADMIN_LIST' },
            ]
          : [{ type: 'User', id: 'EDITOR_ADMIN_LIST' }],
    }),

    createUser: builder.mutation<IUser, CreateUserDto>({
      query: (userData) => ({
        url: '/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUser: builder.mutation<IUser, { id: string; data: UpdateUserDto }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetEditorsAndAdminsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useLazyGetUsersQuery,
  useLazyGetUserByIdQuery,
} = usersApi;
import { CreateGameDto, IGame, UpdateGameDto } from "../../../types/game.types";
import { baseApi } from "./baseApi";

export const gamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<IGame[], void>({
      query: () => "/games",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Game" as const, id: _id })),
              { type: "Game", id: "LIST" },
            ]
          : [{ type: "Game", id: "LIST" }],
    }),

    getGameById: builder.query<IGame, string>({
      query: (id) => `/games/${id}`,
      providesTags: (result, error, id) => [{ type: "Game", id }],
    }),

    createGame: builder.mutation<IGame, CreateGameDto>({
      query: (data) => ({
        url: "/games",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Game", id: "LIST" }],
    }),

    updateGame: builder.mutation<IGame, { id: string; data: UpdateGameDto }>({
      query: ({ id, data }) => ({
        url: `/games/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Game", id },
        { type: "Game", id: "LIST" },
      ],
    }),

    deleteGame: builder.mutation<void, string>({
      query: (id) => ({
        url: `/games/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Game", id },
        { type: "Game", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetGamesQuery,
  useGetGameByIdQuery,
  useCreateGameMutation,
  useUpdateGameMutation,
  useDeleteGameMutation,
  useLazyGetGamesQuery,
  useLazyGetGameByIdQuery,
} = gamesApi;

import { CreateSessionDto, ISession, JoinSessionDto, LeaveSessionDto, RemovePlayerDto, UpdatePlayerNameDto } from "../../../types/session.types";
import { baseApi } from "./baseApi";

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<ISession[], void>({
      query: () => "/sessions",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({
                type: "Session" as const,
                id: _id,
              })),
              { type: "Session", id: "LIST" },
            ]
          : [{ type: "Session", id: "LIST" }],
    }),

    getSessionById: builder.query<ISession, string>({
      query: (id) => `/sessions/${id}`,
      providesTags: (result, error, id) => [{ type: "Session", id }],
    }),

    createSessionRaw: builder.mutation<ISession, Partial<ISession>>({
      query: (data) => ({
        url: "/sessions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Session", id: "LIST" }],
    }),

    deleteSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `/sessions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Session", id },
        { type: "Session", id: "LIST" },
      ],
    }),

    createSession: builder.mutation<ISession, CreateSessionDto>({
      query: (body) => ({
        url: "/sessions/create",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Session", id: "LIST" }],
    }),

    joinSession: builder.mutation<ISession, JoinSessionDto>({
      query: (body) => ({
        url: "/sessions/join",
        method: "POST",
        body,
      }),
    }),

    leaveSession: builder.mutation<
      ISession,
      { sessionId: string; data: LeaveSessionDto }
    >({
      query: ({ sessionId, data }) => ({
        url: `/sessions/${sessionId}/leave`,
        method: "POST",
        body: data,
      }),
    }),

    removePlayer: builder.mutation<
      ISession,
      { sessionId: string; data: RemovePlayerDto }
    >({
      query: ({ sessionId, data }) => ({
        url: `/sessions/${sessionId}/remove-player`,
        method: "POST",
        body: data,
      }),
    }),

    updatePlayerName: builder.mutation<
      ISession,
      { sessionId: string; data: UpdatePlayerNameDto }
    >({
      query: ({ sessionId, data }) => ({
        url: `/sessions/${sessionId}/update-player-name`,
        method: "POST",
        body: data,
      }),
    }),

    startGame: builder.mutation<ISession, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/start`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useLazyGetSessionsQuery,
  useGetSessionByIdQuery,
  useLazyGetSessionByIdQuery,
  useCreateSessionRawMutation,
  useDeleteSessionMutation,
  useCreateSessionMutation,
  useJoinSessionMutation,
  useLeaveSessionMutation,
  useRemovePlayerMutation,
  useUpdatePlayerNameMutation,
  useStartGameMutation,
} = sessionsApi;
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
      invalidatesTags: (result, error, arg) => 
        result ? [{ type: "Session", id: result._id }] : [],
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
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
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
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
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
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
    }),

    selectGame: builder.mutation<
      ISession,
      { sessionId: string; gameId: string }
    >({
      query: ({ sessionId, gameId }) => ({
        url: `/sessions/${sessionId}/select-game`,
        method: "POST",
        body: { gameId },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
    }),

    startGame: builder.mutation<ISession, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/start`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "Session", id: sessionId },
      ],
    }),

    gameAction: builder.mutation<
      ISession,
      { 
        sessionId: string; 
        action: "updatePhase" | "updateScore" | "incrementRound" | "updateData";
        payload: any;
      }
    >({
      query: ({ sessionId, action, payload }) => ({
        url: `/sessions/${sessionId}/game-action`,
        method: "POST",
        body: { action, payload },
      }),
      invalidatesTags: (result, error, { sessionId }) => [
        { type: "Session", id: sessionId },
      ],
    }),

    endGame: builder.mutation<ISession, string>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/end-game`,
        method: "POST",
      }),
      invalidatesTags: (result, error, sessionId) => [
        { type: "Session", id: sessionId },
      ],
    }),

    getSessionsByUser: builder.query<ISession[], string>({
      query: (userId) => `/sessions/user/${userId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Session" as const, id: _id })),
              { type: "Session", id: "LIST" },
            ]
          : [{ type: "Session", id: "LIST" }],
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
  useSelectGameMutation,
  useStartGameMutation,
  useGameActionMutation,
  useEndGameMutation,
  useGetSessionsByUserQuery,
} = sessionsApi;
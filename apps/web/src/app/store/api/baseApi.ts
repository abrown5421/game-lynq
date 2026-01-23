import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["User", "Auth", "Session"],
  endpoints: () => ({}),
});

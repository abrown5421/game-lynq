export const ordersApiTemplate = () => `import {
  CreateOrderDto,
  IOrder,
  UpdateOrderDto,
} from "../../../types/order.types";
import { baseApi } from "./baseApi";

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IOrder[], void>({
      query: () => "/orders",
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Order" as const, id: _id })),
              { type: "Order", id: "LIST" },
            ]
          : [{ type: "Order", id: "LIST" }],
    }),

    getOrderById: builder.query<IOrder, string>({
      query: (id) => \`/orders/\${id}\`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),

    createOrder: builder.mutation<IOrder, CreateOrderDto>({
      query: (data) => ({
        url: "/orders",
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Order", id: "LIST" },
        { type: "Order", id: \`pending-\${arg.order_user_id}\` },
      ],
    }),

    updateOrder: builder.mutation<
      IOrder,
      { id: string; userId: string; data: UpdateOrderDto }
    >({
      query: ({ id, data }) => ({
        url: \`/orders/\${id}\`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id, userId }) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
        { type: "Order", id: \`pending-\${userId}\` },
      ],
    }),

    deleteOrder: builder.mutation<void, string>({
      query: (id) => ({
        url: \`/orders/\${id}\`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Order", id },
        { type: "Order", id: "LIST" },
      ],
    }),

    getPendingOrder: builder.query<IOrder, string>({
      query: (userId) => \`/orders/utils/pending/\${userId}\`,
      providesTags: (result, error, userId) => [{ type: "Order", id: \`pending-\${userId}\` }],
    }),

    getUserOrders: builder.query<IOrder[], string>({
      query: (userId) => \`/orders/utils/user/\${userId}\`,
      providesTags: (result, error, userId) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: "Order" as const, id: _id })),
              { type: "Order", id: \`user-\${userId}\` },
            ]
          : [{ type: "Order", id: \`user-\${userId}\` }],
    }),

    addItemToOrder: builder.mutation<IOrder, { orderId: string; productId: string; productPrice: number }>({
      query: ({ orderId, productId, productPrice }) => ({
        url: \`/orders/utils/\${orderId}/add-item\`,
        method: "POST",
        body: { productId, productPrice },
      }),
      invalidatesTags: (result, error, { orderId, productId, productPrice }) => [
        { type: 'Order', id: \`pending-\${result?.order_user_id}\` }, 
      ],
    }),

    decrementItemInOrder: builder.mutation<IOrder, { orderId: string; productId: string; productPrice: number }>({
      query: ({ orderId, productId, productPrice }) => ({
        url: \`/orders/utils/\${orderId}/remove-item\`,
        method: "POST",
        body: { productId, productPrice },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: \`pending-\${result?.order_user_id}\` }, 
      ],
    }),

    removeAllOfItemFromOrder: builder.mutation<IOrder, { orderId: string; productId: string; productPrice: number }>({
      query: ({ orderId, productId, productPrice }) => ({
        url: \`/orders/utils/\${orderId}/remove-all/\${productId}\`,
        method: "DELETE",
        body: { productPrice },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: \`pending-\${result?.order_user_id}\` }, 
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useLazyGetOrdersQuery,
  useLazyGetOrderByIdQuery,
  useGetPendingOrderQuery,
  useGetUserOrdersQuery,
  useAddItemToOrderMutation,
  useDecrementItemInOrderMutation,
  useRemoveAllOfItemFromOrderMutation,
} = ordersApi;`
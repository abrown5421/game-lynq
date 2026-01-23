export const useCartBadgeImplTemplates = () => `import { useGetPendingOrderQuery } from "../../app/store/api/ordersApi";

export function useCartBadgeImpl(userId?: string) {
  const { data } = useGetPendingOrderQuery(userId!, {
    skip: !userId,
  });

  return {
    count: data?.order_item_count ?? 0,
  };
}
`
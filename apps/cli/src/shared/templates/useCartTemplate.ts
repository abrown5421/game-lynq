export const useCartTemplate = () => `import { useCallback } from 'react';
import { useCreateOrderMutation, useGetPendingOrderQuery, useUpdateOrderMutation } from '../../app/store/api/ordersApi';
import { IProduct } from '../../types/product.types';
import { CreateOrderDto, IOrder, UpdateOrderDto } from '../../types/order.types';

interface UseCartParams {
  userId?: string;
}

interface AddToCartParams {
  product: IProduct;
}

export const useCart = ({ userId }: UseCartParams) => {
  const { data: pendingOrder, isLoading: isLoadingOrder } = useGetPendingOrderQuery(userId!, {
    skip: !userId,
  });
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();

  const calculateOrderTotals = (
    items: string[],
    products: IProduct[]
  ): Pick<
    IOrder,
    'order_item_count' | 'order_item_subtotal' | 'order_item_tax' | 'order_item_shipping' | 'order_item_total'
  > => {
    const itemCount = items.length;
    const subtotal = products.reduce((sum, product) => sum + product.product_price, 0);
    const tax = subtotal * 0.06;
    const shipping = 4 + (0.05 * itemCount);
    const total = subtotal + tax + shipping;

    return {
      order_item_count: itemCount,
      order_item_subtotal: Number(subtotal.toFixed(2)),
      order_item_tax: Number(tax.toFixed(2)),
      order_item_shipping: Number(shipping.toFixed(2)),
      order_item_total: Number(total.toFixed(2)),
    };
  };

  const addToCart = useCallback(
    async ({ product }: AddToCartParams): Promise<IOrder> => {
      if (!userId) {
        throw new Error('User must be logged in to add items to cart');
      }

      if (!pendingOrder) {
        const newOrderItems = [product._id];
        const totals = calculateOrderTotals(newOrderItems, [product]);

        const newOrderData: CreateOrderDto = {
          order_user_id: userId,
          order_items: newOrderItems,
          order_paid: false,
          order_status: 'pending',
          ...totals,
        };

        const result = await createOrder(newOrderData).unwrap();
        return result;
      } else {
        const updatedItems = [...pendingOrder.order_items, product._id];
        
        const currentSubtotal = pendingOrder.order_item_subtotal;
        const newSubtotal = currentSubtotal + product.product_price;
        const newTax = newSubtotal * 0.06;
        const newItemCount = pendingOrder.order_item_count + 1;
        const newShipping = 4 + (0.05 * newItemCount);
        const newTotal = newSubtotal + newTax + newShipping;

        const updateData: UpdateOrderDto = {
          order_user_id: userId,
          order_item_count: newItemCount,
          order_items: updatedItems,
          order_item_subtotal: Number(newSubtotal.toFixed(2)),
          order_item_tax: Number(newTax.toFixed(2)),
          order_item_shipping: Number(newShipping.toFixed(2)),
          order_item_total: Number(newTotal.toFixed(2)),
        };

        const result = await updateOrder({
          id: pendingOrder._id,
          userId: userId,
          data: updateData,
        }).unwrap();

        return result;
      }
    },
    [pendingOrder, userId, createOrder, updateOrder]
  );

  return {
    pendingOrder,
    addToCart,
    isLoading: isLoadingOrder || isCreating || isUpdating,
  };
};`
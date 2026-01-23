export const cartTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useAddItemToOrderMutation, useDecrementItemInOrderMutation, useGetPendingOrderQuery, useRemoveAllOfItemFromOrderMutation } from '../../app/store/api/ordersApi';
import { useAppSelector } from '../../app/store/hooks';
import Loader from '../../features/loader/Loader';
import { useLazyGetProductByIdQuery } from '../../app/store/api/productsApi';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from './CartItem';
import OrderSummary from '../../features/orderSummary/OrderSummary';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: orderData, isLoading, error } = useGetPendingOrderQuery(user?._id!);
  const [addItemToOrder] = useAddItemToOrderMutation();
  const [decrementItemInOrder] = useDecrementItemInOrderMutation();
  const [removeAllOfItemFromOrder] = useRemoveAllOfItemFromOrderMutation();
  const [fetchProduct] = useLazyGetProductByIdQuery();

  const groupedItems = useMemo(() => {
    if (!orderData?.order_items) return [];
    
    const itemMap = new Map<string, number>();
    
    orderData.order_items.forEach((itemId) => {
      itemMap.set(itemId, (itemMap.get(itemId) || 0) + 1);
    });
    
    return Array.from(itemMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
  }, [orderData?.order_items]);

  const handleRemoveItem = async (productId: string) => {
    if (!orderData?._id) return;

    try {
      const product = await fetchProduct(productId).unwrap();
      await removeAllOfItemFromOrder({
        orderId: orderData._id,
        productId,
        productPrice: product.product_price,
      }).unwrap();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const handleIncrementItem = async (productId: string) => {
    if (!orderData?._id) return;

    try {
      const product = await fetchProduct(productId).unwrap();
      await addItemToOrder({
        orderId: orderData._id,
        productId,
        productPrice: product.product_price,
      }).unwrap();
    } catch (err) {
      console.error('Failed to increment item:', err);
    }
  };

  const handleDecrementItem = async (productId: string) => {
    if (!orderData?._id) return;

    try {
      const product = await fetchProduct(productId).unwrap();
      await decrementItemInOrder({
        orderId: orderData._id,
        productId,
        productPrice: product.product_price,
      }).unwrap();
    } catch (err) {
      console.error('Failed to decrement item:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4"
    >
      {isLoading ? (
        <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
            <Loader />
        </div>
      ) : error || !orderData ? (
        <div className="text-center text-red-500 mt-10 font-primary">
          <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-neutral-500">Sorry, there was a problem please try again later.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-contrast font-primary">Shopping Cart</h1>
            <p className="text-neutral-contrast mt-1">
              {orderData.order_item_count} {orderData.order_item_count === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className={\`space-y-3 \${groupedItems.length === 0 ? "lg:col-span-3" : "lg:col-span-2"}\`}>
              {groupedItems.length === 0 ? (
                <div className="text-center py-12 h-full flex flex-col justify-center items-center rounded-lg">
                  <p className="text-neutral-contrast text-lg">Your cart is empty!</p>
                  <div className="text-center mt-4">
                    <button
                      onClick={() => navigate("/")}
                      className="text-primary hover:underline text-sm cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              ) : (
                groupedItems.map(({ productId, quantity }) => (
                  <CartItem 
                    key={productId} 
                    productId={productId} 
                    quantity={quantity}
                    onRemove={handleRemoveItem}
                    onIncrement={handleIncrementItem}
                    onDecrement={handleDecrementItem}
                  />
                ))
              )}
            </div>

            {groupedItems.length > 0 && (
              <OrderSummary 
                orderData={orderData} 
                mode="cart"
              />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Cart;`
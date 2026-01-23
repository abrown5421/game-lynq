export const orderCompleteTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../../app/store/api/ordersApi';
import Loader from '../../features/loader/Loader';
import { useEffect, useState } from 'react';
import { useLazyGetProductByIdQuery } from '../../app/store/api/productsApi';

const ${pageName} = () => {
  const { id } = useParams();
  const { data: orderData, isLoading, error } = useGetOrderByIdQuery(id!);
  const [fetchProduct] = useLazyGetProductByIdQuery();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!orderData?.order_items) return;
    const loadProducts = async () => {
      try {
        const items = await Promise.all(
          orderData.order_items.map((productId) => fetchProduct(productId).unwrap())
        );
        setProducts(items);
      } catch (err) {
        console.error('Failed to fetch products for receipt', err);
      }
    };
    loadProducts();
  }, [orderData, fetchProduct]);

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
          <p className="text-neutral-500">
            Sorry, we couldn't find that order number.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-primary text-neutral-contrast">
              Thank you for your order!
            </h1>
            <p className="text-neutral-500 mt-1">
              Order Number: <span className="font-semibold">{orderData._id}</span>
            </p>
            <div className=''>{orderData.order_status}</div>
            <p className="text-neutral-500 mt-1">
              Placed on: {new Date(orderData.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-neutral3 rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4 font-primary text-neutral">
              Items Purchased
            </h2>
            {products.length === 0 ? (
              <p className="text-neutral-500">Loading items...</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="flex justify-between items-center border-b border-neutral-300 py-2"
                  >
                    <div>
                      <p className="font-primary text-neutral-contrast">{product.product_name}</p>
                      <p className="text-neutral-500 text-sm">{product.product_description}</p>
                    </div>
                    <p className="font-primary font-semibold text-neutral-contrast">
                      \${product.product_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-neutral3 rounded-lg shadow p-4 space-y-2">
            <h2 className="text-xl font-semibold mb-4 font-primary text-neutral">
              Order Summary
            </h2>
            <div className="flex justify-between text-neutral-contrast">
              <span>Subtotal</span>
              <span>\${orderData.order_item_subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-contrast">
              <span>Tax</span>
              <span>\${orderData.order_item_tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-contrast">
              <span>Shipping</span>
              <span>\${orderData.order_item_shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-neutral-contrast text-lg mt-2">
              <span>Total</span>
              <span>\${orderData.order_item_total.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <span className={\`px-2 py-1 rounded text-sm \${
                orderData.order_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }\`}>
                {orderData.order_paid ? 'Paid' : 'Pending Payment'}
              </span>
              <span className={\`px-2 py-1 ml-2 rounded text-sm \${
                orderData.order_shipped ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
              }\`}>
                {orderData.order_shipped ? 'Shipped' : 'Processing'}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ${pageName};`
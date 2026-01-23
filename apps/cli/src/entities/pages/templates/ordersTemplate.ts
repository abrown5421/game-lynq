export const ordersTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useGetUserOrdersQuery } from '../../app/store/api/ordersApi';
import { useAppSelector } from '../../app/store/hooks';
import Loader from '../../features/loader/Loader';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ${pageName} = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { data: myOrders, isLoading, error } = useGetUserOrdersQuery(user?._id!);

  useEffect(() => {
    console.log(myOrders);
  }, [myOrders]);

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
      ) : error || !myOrders || myOrders.length === 0 ? (
        <div className="text-center text-red-500 mt-10 font-primary">
          <h2 className="text-2xl font-semibold mb-2">No Orders Found</h2>
          <p className="text-neutral">
            You haven't placed any orders yet, or there was a problem fetching your orders.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-contrast font-primary">My Orders</h1>
            <p className="text-neutral-contrast mt-1">
              {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </div>
          {myOrders.map((order) => (
            <div
              key={order._id}
              onClick={() => navigate(\`/order-complete/\${order._id}\`)}
              className="cursor-pointer bg-neutral3 hover:bg-neutral4 transition-colors rounded-lg shadow p-4 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0"
            >
              <div className="flex flex-col">
                <span className="text-neutral text-xl">Order Number</span>
                <div className="my-2 h-px w-full bg-neutral" />
                <span className="font-semibold text-neutral-contrast">{order._id}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-neutral text-xl">Status</span>
                <div className="my-2 h-px w-full bg-neutral" />
                <span
                  className={\`px-2 py-1 rounded text-sm font-semibold \${
                    order.order_paid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }\`}
                >
                  {order.order_paid ? 'Paid' : 'Pending Payment'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-neutral text-xl">Placed On</span>
                <div className="my-2 h-px w-full bg-neutral" />
                <span className="font-semibold text-neutral-contrast">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-neutral text-xl">Total</span>
                <div className="my-2 h-px w-full bg-neutral" />
                <span className="font-semibold text-neutral-contrast">
                  \${order.order_item_total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ${pageName};`
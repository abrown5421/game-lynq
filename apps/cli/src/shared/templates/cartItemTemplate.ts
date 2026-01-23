export const cartItemTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useGetProductByIdQuery } from '../../app/store/api/productsApi';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/solid';

interface CartItemProps {
  productId: string;
  quantity: number;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

const CartItem = ({ productId, quantity, onRemove, onIncrement, onDecrement }: CartItemProps) => {
  const { data: product, isLoading } = useGetProductByIdQuery(productId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 p-4 bg-neutral3 rounded-lg animate-pulse">
        <div className="w-20 h-20 bg-neutral2 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-neutral2 rounded w-3/4" />
          <div className="h-3 bg-neutral2 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!product) return null;

  const itemTotal = product.product_price * quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 p-4 bg-neutral3 rounded-lg hover:bg-neutral-750 transition-colors"
    >
      <img
        src={product.product_image}
        alt={product.product_name}
        className="w-20 h-20 object-cover rounded"
      />
      
      <div className="flex-1">
        <h3 className="font-primary text-lg font-semibold text-neutral">
          {product.product_name}
        </h3>
        <p className="text-sm text-neutral-contrast">{product.product_category}</p>
        <p className="text-lg font-sans font-semibold text-primary mt-1">
          \${product.product_price.toFixed(2)}\ {quantity > 1 && <span className="text-sm text-neutral-contrast">× {quantity}</span>}
        </p>
        {quantity > 1 && (
          <p className="text-sm font-sans text-neutral-contrast mt-1">
            Item total: \${itemTotal.toFixed(2)}\
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-neutral2 rounded-lg p-1">
          <button
            onClick={() => quantity > 1 ? onDecrement(productId) : onRemove(productId)}
            className="p-1.5 hover:bg-neutral3 rounded transition-colors"
            aria-label={quantity > 1 ? "Decrease quantity" : "Remove item"}
          >
            {quantity > 1 ? (
              <MinusIcon className="w-4 h-4 text-neutral-contrast" />
            ) : (
              <TrashIcon className="w-4 h-4 text-red-500" />
            )}
          </button>

          <span className="text-neutral font-semibold min-w-[2ch] text-center">
            {quantity}
          </span>

          <button
            onClick={() => onIncrement(productId)}
            className="p-1.5 hover:bg-neutral3 rounded transition-colors"
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-4 h-4 text-neutral-contrast" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartItem;`
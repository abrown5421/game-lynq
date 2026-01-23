export const productTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetProductByIdQuery } from '../../app/store/api/productsApi';
import Loader from '../../features/loader/Loader';
import { useState } from 'react';
import { useCart } from '../cart/useCart';
import { useGetCurrentUserQuery } from '../../app/store/api/authApi';
import { useAppDispatch } from '../../app/store/hooks';
import { openAlert } from '../../features/alert/alertSlice';

const Product = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useGetProductByIdQuery(id!);
  const { data: activeUser } = useGetCurrentUserQuery();
  
  const { addToCart, isLoading: isAddingToCart } = useCart({ 
    userId: activeUser?._id 
  });
  const [cartError, setCartError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!activeUser?._id) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Please login to add items to your cart',
        anchor: { x: 'right', y: 'bottom' },
      }));
      return;
    }

    try {
      setCartError(null);
      await addToCart({ product });
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'success',
        message: 'Item added to cart!',
        anchor: { x: 'right', y: 'bottom' },
      }));
      
    } catch (err) {
      setCartError('Failed to add item to cart. Please try again.');
      console.error('Error adding to cart:', err);
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Failed to add item to cart',
        anchor: { x: 'right', y: 'bottom' },
      }));
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    if (!activeUser?._id) {
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Please login to complete your purchase',
        anchor: { x: 'right', y: 'bottom' },
      }));
      return;
    }

    try {
      setCartError(null);
      await addToCart({ product });
      navigate('/checkout');
    } catch (err) {
      setCartError('Failed to process request. Please try again.');
      console.error('Error adding to cart:', err);
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'error',
        message: 'Failed to process request',
        anchor: { x: 'right', y: 'bottom' },
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-neutral sup-min-nav relative z-0 p-4 flex flex-col justify-center items-center"
    >
      {isLoading ? (
        <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
            <Loader />
        </div>
      ) : error || !product ? (
        <div className="text-center text-primary mt-10">
          <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>s
          <p className="text-neutral-500">Sorry, we couldn't find the product you are looking for.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center">
            <img
              src={product.product_image}
              alt={product.product_name}
              className="rounded-lg shadow-lg object-contain"
            />
          </div>
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl font-bold text-neutral-900">{product.product_name}</h1>
            <span className="text-sm text-neutral-500 uppercase tracking-wide">{product.product_category}</span>
            <p className="text-neutral-600">{product.product_description}</p>
            <span className="text-2xl font-semibold text-primary">\${product.product_price.toFixed(2)}\</span>
            
            {cartError && (
              <div className="text-red-600 text-sm">{cartError}</div>
            )}
            
            <div className="flex flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? 'Adding...' : 'Add To Cart'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Product;`
export const productsTemplate = (pageName: string) => `import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGetProductsQuery } from '../../app/store/api/productsApi';
import { useGetCurrentUserQuery } from '../../app/store/api/authApi';
import { useAppDispatch } from '../../app/store/hooks';
import { openAlert } from '../../features/alert/alertSlice';
import { useCart } from '../cart/useCart';
import Loader from '../../features/loader/Loader';
import { IProduct } from '../../types/product.types';
import Pagination from '../../features/pagination/Pagination';
import SearchBar from '../../features/searchBar/SearchBar';

const PRODUCTS_PER_PAGE = 20;

const ${pageName} = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: products, isLoading, error } = useGetProductsQuery();
  const { data: activeUser } = useGetCurrentUserQuery();
  const { addToCart, isLoading: isAddingToCart } = useCart({ 
    userId: activeUser?._id 
  });
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    if (!products) return [];
    const cats = Array.from(new Set(products.map(p => p.product_category)));
    return ['All', ...cats]; 
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesSearch = product.product_name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || product.product_category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (e: React.MouseEvent, product: IProduct) => {
    e.stopPropagation();
    
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
      await addToCart({ product });
      dispatch(openAlert({
        open: true,
        closeable: true,
        severity: 'success',
        message: 'Item added to cart successfully!',
        anchor: { x: 'right', y: 'bottom' },
      }));
    } catch (err) {
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

  if (isLoading) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error || !products) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 flex flex-col justify-center items-center p-8">
        <h2 className="text-2xl font-semibold mb-2 text-red-500 font-primary">
          Products Not Found
        </h2>
        <p className="text-neutral-500">
          Sorry, we couldn't find the products you were looking for.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4 flex flex-col items-center"
    >
      <div className="max-w-6xl w-full">
        <div className="w-full mb-6 flex flex-col md:flex-row gap-4">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search products..."
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-48 input-primary"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-semibold text-lg">
            No products match your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map(product => (
              <div
                key={product._id}
                onClick={() => navigate(\`/product/\${product._id}\`)}
                className="rounded-md overflow-hidden shadow-xl flex flex-col h-full cursor-pointer bg-white"
              >
                <img
                  src={product.product_image}
                  alt={product.product_name}
                  className="w-full h-48 object-cover"
                />

                <div className="p-2 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg">
                    {product.product_name}
                  </h3>

                  <p className="text-primary font-bold mb-1">
                    {product.product_price.toFixed(2)}
                  </p>

                  <p className="text-secondary text-sm mb-1">
                    {product.product_description}
                  </p>

                  <p className="text-neutral-400 text-xs mb-5">
                    {product.product_category}
                  </p>
                  <hr className="mt-auto mb-2 border-t border-gray-300" />
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={isAddingToCart}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? 'Adding...' : 'Add To Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            maxVisiblePages={7}
          />
        )}
      </div>
    </motion.div>
  );
};

export default ${pageName};
`;
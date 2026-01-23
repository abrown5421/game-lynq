export const orderSummaryTemplate = () => `import React from 'react';
import { useNavigate } from 'react-router-dom';

interface OrderData {
  order_item_subtotal: number;
  order_item_shipping: number;
  order_item_tax: number;
  order_item_total: number;
  order_status: string;
  order_items: string[];
}

interface OrderSummaryProps {
  orderData: OrderData;
  mode: 'cart' | 'checkout';
  onPrimaryAction?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  orderData, 
  mode, 
  onPrimaryAction,
  disabled = false 
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (mode === 'cart') {
      navigate('/checkout');
    } else if (onPrimaryAction) {
      onPrimaryAction(e);
    }
  };

  const buttonText = mode === 'cart' ? 'Proceed to Checkout' : 'Complete Order';
  const isDisabled = mode === 'cart' ? orderData.order_items.length === 0 : disabled;

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-4">
        <div className="bg-neutral3 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-neutral font-primary mb-4">
            Order Summary:
          </h2>
          
          <div className="space-y-3 text-neutral-contrast">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className='font-sans'>\${orderData.order_item_subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className='font-sans'>\${orderData.order_item_shipping.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax</span>
              <span className='font-sans'>\${orderData.order_item_tax.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-neutral-700 pt-3 mt-3">
              <div className="flex justify-between text-lg font-semibold text-neutral">
                <span>Total</span>
                <span className='font-sans'>\${orderData.order_item_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-neutral-contrast text-center">
            Status: <span className="capitalize">{orderData.order_status}</span>
          </div>

          <button
            className={\`mt-6 btn-primary \${mode === 'checkout' ? 'w-full' : ''}\`}
            disabled={isDisabled}
            onClick={handlePrimaryClick}
          >
            {buttonText}
          </button>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-primary hover:underline text-sm cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;`
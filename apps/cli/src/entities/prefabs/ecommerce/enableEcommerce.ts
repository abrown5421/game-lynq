import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addFeature } from "../../features/addFeature.js";
import { addPage } from "../../pages/addPage.js";
import { cartTemplate } from '../../pages/templates/cartTemplate.js';
import { checkoutTemplate } from '../../pages/templates/checkeoutTemplate.js';
import { ordersTemplate } from '../../pages/templates/ordersTemplate.js';
import { orderCompleteTemplate } from '../../pages/templates/orderCompleteTemplate.js';
import { productsTemplate } from '../../pages/templates/productsTemplate.js';
import { productTemplate } from '../../pages/templates/productTemplate.js';
import { useCartTemplate } from '../../../shared/templates/useCartTemplate.js';
import { ordersApiTemplate } from '../../../shared/templates/ordersApiTemplate.js';
import { orderSummaryTemplate } from '../../../shared/templates/orderSummaryTemplate.js';
import { ordersRoutesTemplate } from '../../../shared/templates/orders.routes.template.js';
import { cartItemTemplate } from '../../../shared/templates/cartItemTemplate.js';
import { updateNavbar } from '../../pages/updateNavbar.js';
import { useCartBadgeImplTemplates } from '../../../shared/templates/useCartBadge.impl.templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function enableEcommerce() {
    const cartDir = path.resolve(__dirname, '../../../../../web/src/pages/cart');
    const ordersApiPath = path.resolve(__dirname, '../../../../../web/src/app/store/api/ordersApi.ts');
    const ordersRoutePath = path.resolve(__dirname, '../../../../../api/src/routes/orders.routes.ts');
    const orderSummaryDir = path.resolve(__dirname, '../../../../../web/src/features/orderSummary');
    const navbarPath = path.resolve(__dirname, '../../../../../web/src/features/navbar/Navbar.tsx');
   
    await addFeature({
        featureName: "Product",
        addTimestamps: true,
        addToCms: true,
        schema: {
            name: "Product",
            fields: [
                { name: "product_name", type: "String", required: true },
                { name: "product_category", type: "String", required: true },
                { name: "product_description", type: "String", required: true },
                { name: "product_price", type: "Number", required: true },
                { name: "product_image", type: "String", required: false },
            ],
        },
    });
        
    await addFeature({
        featureName: "Order",
        addTimestamps: true,
        addToCms: true,
        schema: {
            name: "Order",
            fields: [
            {
                name: "order_user_id",
                type: "ObjectId",
                ref: "User",
                required: true,
            },
            {
                name: "order_item_count",
                type: "Number",
                required: true,
            },
            {
                name: "order_items",
                type: "Array",
                required: true,
                ref: "Product",
            },
            {
                name: "order_item_subtotal",
                type: "Number",
                required: true,
            },
            {
                name: "order_item_tax",
                type: "Number",
                required: true,
            },
            {
                name: "order_item_shipping",
                type: "Number",
                required: true,
            },
            {
                name: "order_item_total",
                type: "Number",
                required: true,
            },
            {
                name: "order_paid",
                type: "Boolean",
                required: true,
            },
            {
                name: "order_shipped",
                type: "Boolean",
                required: false,
            },
            {
                name: "order_status",
                type: "String",
                required: true,
                enum: ["pending", "purchased", "completed"],
                default: "pending",
            },
            ],
        },
    });

    await addPage({
        pageName: 'Checkout',
        routePath: '/checkout',
        addToNavbar: false,
        template: checkoutTemplate
    });

    await addPage({
        pageName: 'Cart',
        routePath: '/cart',
        addToNavbar: false,
        template: cartTemplate
    });

    await addPage({
        pageName: 'Orders',
        routePath: '/orders',
        addToNavbar: false,
        template: ordersTemplate
    });

    await addPage({
        pageName: 'OrderComplete',
        routePath: '/order-complete/:id',
        addToNavbar: false,
        template: orderCompleteTemplate
    });

    await addPage({
        pageName: 'Product',
        routePath: '/product/:id',
        addToNavbar: false,
        template: productTemplate
    });

    await updateNavbar('Cart', '/cart', true);
    await updateNavbar('My Orders', '/orders', true);
    
    await addPage({
        pageName: 'Products',
        routePath: '/products',
        addToNavbar: true,
        template: productsTemplate
    });

    if (!fs.existsSync(cartDir)) {
        fs.mkdirSync(cartDir, { recursive: true });
    }

    const fileName = 'CartItem.tsx';
    const content = cartItemTemplate('CartItem');

    fs.writeFileSync(path.join(cartDir, fileName), content, 'utf8');

    const hookFileName = 'useCart.ts';
    const hookContent = useCartTemplate();

    fs.writeFileSync(path.join(cartDir, hookFileName), hookContent, 'utf8');
    
    const ordersApiContent = ordersApiTemplate();

    fs.writeFileSync(ordersApiPath, ordersApiContent, 'utf8');

    const ordersRouteContent = ordersRoutesTemplate();

    fs.writeFileSync(ordersRoutePath, ordersRouteContent, 'utf8');1
    
    if (!fs.existsSync(orderSummaryDir)) {
        fs.mkdirSync(orderSummaryDir, { recursive: true });
    }

    const orderSummaryFileName = 'OrderSummary.tsx';
    const orderSummaryContent = orderSummaryTemplate();

    fs.writeFileSync(path.join(orderSummaryDir, orderSummaryFileName), orderSummaryContent, 'utf8');

    const implName = 'useCartBadge.impl.ts'
    const implCont = useCartBadgeImplTemplates();
    fs.writeFileSync(path.join(cartDir, implName), implCont, 'utf8');
  
    if (fs.existsSync(navbarPath)) {
        let navbarContent = fs.readFileSync(navbarPath, 'utf8');
        
        if (!navbarContent.includes('useGetPendingOrderQuery')) {
            const importLine = `import { useGetPendingOrderQuery } from "../../app/store/api/ordersApi";`;
            const lastImportIndex = navbarContent.lastIndexOf('import');
            const nextLineIndex = navbarContent.indexOf('\n', lastImportIndex);
            navbarContent = navbarContent.slice(0, nextLineIndex + 1) + importLine + '\n' + navbarContent.slice(nextLineIndex + 1);
        }
        
        if (!navbarContent.includes('useGetPendingOrderQuery(')) {
            const hookLine = `  const { data: userOrder } = useGetPendingOrderQuery(user?._id!, {skip: !user?._id,});`;
            const selectorIndex = navbarContent.indexOf('useAppSelector((state) => state.auth);');
            const nextLineIndex = navbarContent.indexOf('\n', selectorIndex);
            navbarContent = navbarContent.slice(0, nextLineIndex + 1) + hookLine + '\n' + navbarContent.slice(nextLineIndex + 1);
        }
        
        if (!navbarContent.includes('userOrder?.order_item_count')) {
            const badgeCode = `
                        {userOrder?.order_item_count ? (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-neutral bg-red-500 rounded-full">
                            {userOrder.order_item_count}
                        </span>
                        ) : null}`;
            
            const iconCloseTag = '<ShoppingBagIcon className="w-full h-full text-secondary" />';
            navbarContent = navbarContent.replace(iconCloseTag, iconCloseTag + badgeCode);
        }
        
        fs.writeFileSync(navbarPath, navbarContent, 'utf8');
        console.log('Navbar updated with orders query and badge');
    }
}
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteFeature } from '../../features/deleteFeature.js';
import { deletePage } from '../../pages/deletePage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function disableEcommerce() {
    const cartDir = path.resolve(__dirname, '../../../../../web/src/pages/cart');
    const ordersApiPath = path.resolve(__dirname, '../../../../../web/src/app/store/api/ordersApi.ts');
    const orderSummaryDir = path.resolve(__dirname, '../../../../../web/src/features/orderSummary');
    const navbarPath = path.resolve(__dirname, '../../../../../web/src/features/navbar/Navbar.tsx');

    await deleteFeature({ featureName: "Product" });
    await deleteFeature({ featureName: "Order" });

    await deletePage({ pageName: 'Checkout' });
    await deletePage({ pageName: 'Cart' });
    await deletePage({ pageName: 'Orders' });
    await deletePage({ pageName: 'OrderComplete' });
    await deletePage({ pageName: 'Products' });
    await deletePage({ pageName: 'Product' });

    const cartFiles = ['CartItem.tsx', 'useCart.ts'];
    cartFiles.forEach(file => {
        const filePath = path.join(cartDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`${file} deleted from ${cartDir}`);
        }
    });

    if (fs.existsSync(ordersApiPath)) {
        fs.unlinkSync(ordersApiPath);
        console.log(`ordersApi.ts deleted from ${ordersApiPath}`);
    }

    if (fs.existsSync(orderSummaryDir)) {
        fs.rmSync(orderSummaryDir, { recursive: true, force: true });
        console.log(`OrderSummary folder deleted from ${orderSummaryDir}`);
    }

    if (fs.existsSync(cartDir) && fs.readdirSync(cartDir).length === 0) {
        fs.rmdirSync(cartDir);
        console.log(`Cart folder removed as it is now empty`);
    }

    if (fs.existsSync(navbarPath)) {
        let navbarContent = fs.readFileSync(navbarPath, 'utf8');
        
        navbarContent = navbarContent.replace(
        /import\s+{\s*useGetPendingOrderQuery\s*}\s+from\s+["'].*ordersApi["'];?\n?/g,
        ''
        );
        
        navbarContent = navbarContent.replace(
        /\s*const\s+{\s*data:\s*userOrder\s*}\s*=\s*useGetPendingOrderQuery\([^)]+\);?\n?/g,
        ''
        );
        
        const iconLine = '<ShoppingBagIcon className="w-full h-full text-secondary" />';
        const parts = navbarContent.split(iconLine);
        
        if (parts.length === 2) {
        const afterIcon = parts[1];
        const badgeStart = afterIcon.indexOf('{userOrder');
        
        if (badgeStart !== -1) {
            let braceCount = 0;
            let badgeEnd = -1;
            
            for (let i = badgeStart; i < afterIcon.length; i++) {
            if (afterIcon[i] === '{') braceCount++;
            if (afterIcon[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                badgeEnd = i + 1;
                break;
                }
            }
            }
            
            if (badgeEnd !== -1) {
            const cleanedAfterIcon = afterIcon.slice(0, badgeStart) + afterIcon.slice(badgeEnd);
            navbarContent = parts[0] + iconLine + cleanedAfterIcon;
            }
        }
        }
        
        fs.writeFileSync(navbarPath, navbarContent, 'utf8');
        console.log('Navbar updated - removed orders query and badge');
    }
    
}

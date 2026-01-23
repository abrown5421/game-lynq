import { pageTemplate } from './pageTemplate.js';
import { blogTemplate } from './blogTemplate.js';
import { blogPostTemplate } from './blogPostTemplate.js';
import { staffTemplate } from './staffPageTemplate.js';
import { productsTemplate } from './productsTemplate.js';
import { productTemplate } from './productTemplate.js';
import { cartTemplate } from './cartTemplate.js';
import { checkoutTemplate } from './checkeoutTemplate.js';
import { ordersTemplate } from './ordersTemplate.js';
import { orderCompleteTemplate } from './orderCompleteTemplate.js';

export const templates: Record<string, (pageName: string) => string> = {
  default: pageTemplate,
  blog: blogTemplate,
  blogPost: blogPostTemplate,
  staff: staffTemplate,
  products: productsTemplate,
  product: productTemplate,
  cart: cartTemplate,
  checkout: checkoutTemplate,
  order: ordersTemplate,
  orderComplete: orderCompleteTemplate 
};

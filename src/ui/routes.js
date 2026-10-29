import home from './views/home.js';
import catalog from './views/catalog.js';
import productDetail from './views/product-detail.js';
import login from './views/login.js';
import register from './views/register.js';
import checkout from './views/checkout.js';
import orderConfirmation from './views/order-confirmation.js';
import receipt from './views/receipt.js';
import mailbox from './views/mailbox.js';
import myOrders from './views/account/orders.js';
import orderDetail from './views/account/order-detail.js';
import downloads from './views/account/downloads.js';
import learn from './views/learn.js';
import learnCourse from './views/learn-course.js';
import profile from './views/account/profile.js';
import addresses from './views/account/addresses.js';
import forgotPassword from './views/forgot-password.js';
import resetPassword from './views/reset-password.js';
import adminOrders from './views/admin/orders.js';
import adminProducts from './views/admin/products.js';
import adminProductForm from './views/admin/product-form.js';
import adminCategories from './views/admin/categories.js';
import adminDashboard from './views/admin/dashboard.js';

export const ROUTES = [
  { pattern: '/', view: home },
  { pattern: '/catalogo', view: catalog },
  { pattern: '/producto/:id', view: productDetail },
  { pattern: '/login', view: login },
  { pattern: '/registro', view: register },
  { pattern: '/checkout', view: checkout },
  { pattern: '/pedido/:id/confirmacion', view: orderConfirmation },
  { pattern: '/comprobante/:id', view: receipt },
  { pattern: '/buzon', view: mailbox },
  { pattern: '/cuenta/pedidos', view: myOrders },
  { pattern: '/cuenta/pedidos/:id', view: orderDetail },
  { pattern: '/cuenta/descargas', view: downloads },
  { pattern: '/aprende', view: learn },
  { pattern: '/aprende/:id', view: learnCourse },
  { pattern: '/cuenta', view: profile },
  { pattern: '/cuenta/direcciones', view: addresses },
  { pattern: '/recuperar', view: forgotPassword },
  { pattern: '/restablecer/:token', view: resetPassword },
  { pattern: '/admin', view: adminDashboard },
  { pattern: '/admin/pedidos', view: adminOrders },
  { pattern: '/admin/productos', view: adminProducts },
  { pattern: '/admin/productos/nuevo', view: adminProductForm },
  { pattern: '/admin/productos/:id', view: adminProductForm },
  { pattern: '/admin/categorias', view: adminCategories },
];

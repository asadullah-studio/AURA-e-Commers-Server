import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import auth from './src/lib/auth.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import prisma from './src/lib/prisma.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.all('/api/auth/*', toNodeHandler(auth));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use(errorHandler);

const PORT = 5095;
const server = app.listen(PORT, async () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);

  const BASE = `http://127.0.0.1:${PORT}/api`;
  let cookie = '';

  async function req(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (cookie) headers['Cookie'] = cookie;
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie.split(';')[0];
    }
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, headers: res.headers };
  }

  try {
    console.log('\n--- 1. Testing Health Check ---');
    const health = await req('/health');
    console.log('Health:', health.status, health.data);
    if (health.data.status !== 'ok') throw new Error('Health check failed');

    console.log('\n--- 2. Testing Categories ---');
    const cats = await req('/categories');
    console.log(`Found ${cats.data.data?.length} categories`);
    if (cats.data.data?.length !== 4) throw new Error('Expected 4 categories');

    console.log('\n--- 3. Testing Products Catalog & Filtering ---');
    const allProds = await req('/products');
    console.log(`Total products: ${allProds.data.count}`);
    if (allProds.data.count < 30) throw new Error('Expected at least 30-40 products');

    const menProds = await req('/products?category=men');
    console.log(`Men products: ${menProds.data.count}`);
    if (menProds.data.count !== 12) throw new Error('Expected 12 Men products');

    const womenProds = await req('/products?category=women');
    console.log(`Women products: ${womenProds.data.count}`);
    if (womenProds.data.count !== 12) throw new Error('Expected 12 Women products');

    const searchProds = await req('/products?search=panjabi');
    console.log(`Search for "panjabi": ${searchProds.data.count} matches`);

    const singleProd = allProds.data.data[0];
    const prodDetail = await req(`/products/${singleProd.id}`);
    console.log(`Single Product Detail: "${prodDetail.data.data?.name}" (৳${prodDetail.data.data?.price})`);

    console.log('\n--- 4. Testing User Registration & Authentication ---');
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tanvir Ahmed',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    console.log('Registration status:', regRes.status, 'Cookie received:', !!cookie);

    const meRes = await req('/auth/me');
    console.log('Authenticated User Profile:', meRes.data?.data?.user?.email);
    if (!meRes.data?.data?.user) throw new Error('Authentication session verification failed');

    console.log('\n--- 5. Testing Cart Flow ---');
    const addCart1 = await req('/cart', {
      method: 'POST',
      body: JSON.stringify({
        productId: singleProd.id,
        size: 'L',
        quantity: 2,
      }),
    });
    console.log('Add to cart response:', addCart1.data.message);

    // Test duplicate increment: add same product and size
    const addCart2 = await req('/cart', {
      method: 'POST',
      body: JSON.stringify({
        productId: singleProd.id,
        size: 'L',
        quantity: 1,
      }),
    });
    console.log('Deduplication increment:', addCart2.data.message);

    const cartView = await req('/cart');
    console.log(`Cart items: ${cartView.data.data?.items?.length}, Subtotal: ৳${cartView.data.data?.subtotal}, Total Qty: ${cartView.data.data?.totalQuantity}`);
    if (cartView.data.data?.totalQuantity !== 3) throw new Error(`Expected quantity 3, got ${cartView.data.data?.totalQuantity}`);

    console.log('\n--- 6. Testing Order Placement (Cash on Delivery) ---');
    const orderRes = await req('/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Tanvir Ahmed',
        phone: '01712345678',
        email: testEmail,
        address: 'House 42, Road 7/A, Sector 4',
        city: 'Dhaka',
        area: 'Uttara',
      }),
    });
    console.log('Order created:', orderRes.status, 'Order Number:', orderRes.data?.data?.orderNumber, 'Total:', `৳${orderRes.data?.data?.totalAmount}`);
    if (!orderRes.data?.data?.orderNumber) throw new Error('Order creation failed');

    console.log('\n--- 7. Verifying Cart Cleared After Order ---');
    const emptyCartView = await req('/cart');
    console.log('Cart items remaining:', emptyCartView.data.data?.items?.length);
    if (emptyCartView.data.data?.items?.length !== 0) throw new Error('Cart was not cleared after order');

    console.log('\n--- 8. Testing My Orders Retrieval ---');
    const myOrders = await req('/orders');
    console.log(`User has ${myOrders.data.data?.length} order(s)`);
    if (myOrders.data.data?.length !== 1) throw new Error('Expected 1 order in history');

    const myOrderDetail = await req(`/orders/${orderRes.data.data.id}`);
    console.log(`Single order retrieved: #${myOrderDetail.data.data?.orderNumber} with ${myOrderDetail.data.data?.items?.length} item(s)`);

    console.log('\n=========================================');
    console.log('ALL INTEGRATION TESTS PASSED PERFECTLY! ✓');
    console.log('=========================================\n');
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await prisma.$disconnect();
  }
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import auth from './lib/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  })
);

// 1. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Explicit Auth REST routes (register, login, logout, me)
app.use('/api/auth', authRoutes);

// 3. Catch-all Better Auth handler for any direct Better Auth client routes
app.all('/api/auth/*', toNodeHandler(auth));

// 4. API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Clothing E-Commerce API',
    timestamp: new Date().toISOString(),
  });
});

// 5. Application REST Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// 6. 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 7. Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Clothing E-Commerce API running on port ${PORT}`);
  console.log(`Backend URL: http://localhost:${PORT}`);
  console.log(`Allowed Frontend: ${FRONTEND_URL}`);
  console.log(`=========================================`);
});

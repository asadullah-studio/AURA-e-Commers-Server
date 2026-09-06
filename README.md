# AURA Lifestyle — Backend

A RESTful backend API for **AURA Lifestyle**, a modern clothing e-commerce application built for the Bangladeshi apparel market.

The backend handles authentication, products, categories, shopping carts, checkout, orders, database operations, and server-side business logic.

---

## ✨ Features

* 🔐 Better Auth authentication
* 👤 User registration and login
* 🍪 HTTP-only session cookies
* 🔒 Protected API routes
* 👕 Product management
* 🗂️ Category management
* 🛒 Persistent shopping cart
* 📦 Order creation
* 💰 Server-side price calculation
* 💵 Cash on Delivery support
* 🧾 Order history
* 🗄️ PostgreSQL database
* 🔗 Prisma ORM
* 🔄 Atomic database transactions
* 🌱 Database seed script
* 🌐 CORS configuration
* ⚠️ Centralized error handling
* 🧪 API integration testing

---

## 🛠️ Tech Stack

| Technology       | Purpose              |
| ---------------- | -------------------- |
| Node.js          | JavaScript runtime   |
| Express.js       | REST API framework   |
| Better Auth      | Authentication       |
| Prisma           | ORM                  |
| PostgreSQL       | Database             |
| JavaScript / ESM | Application language |
| Render           | Backend deployment   |

---

## 📁 Project Structure

```text
backend/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── cartRoutes.js
│   │   └── orderRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   │
│   ├── lib/
│   │   ├── prisma.js
│   │   └── auth.js
│   │
│   └── server.js
│
├── test-api.js
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Install:

* Node.js 18+
* npm 9+
* PostgreSQL 14+

A remote PostgreSQL provider such as Neon can also be used.

---

## 1. Clone Repository

```bash
git clone https://github.com/asadullah-studio/AURA-e-Commers-Server.git
```

Navigate into the project:

```bash
cd AURA-e-Commers-Server
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Environment Variables

Create:

```bash
.env
```

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/clothing_db"

BETTER_AUTH_SECRET="your-super-secret-key"

BETTER_AUTH_URL="http://localhost:5000"

FRONTEND_URL="http://localhost:3000"

PORT=5000
```

### Production Example

```env
DATABASE_URL="your-production-postgresql-connection-string"

BETTER_AUTH_SECRET="your-production-secret"

BETTER_AUTH_URL="https://aura-e-commers-server.onrender.com"

FRONTEND_URL="https://aura-e-commers-client.vercel.app"
```

> Never commit `.env` or production secrets to Git.

---

## 🗄️ Database Setup

The application uses Prisma with PostgreSQL.

Generate Prisma Client:

```bash
npx prisma generate
```

Synchronize the database schema:

```bash
npx prisma db push
```

---

## 🌱 Seed Database

The project includes seed data for:

* 40 clothing products
* 4 main categories

Run:

```bash
npm run db:seed
```

---

## ▶️ Run Backend

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The server runs by default at:

```text
http://localhost:5000
```

---

# 🔌 API

Production API:

```text
https://aura-e-commers-server.onrender.com/api
```

---

## 🔐 Authentication Endpoints

### Register

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Get Current User

```http
GET /api/auth/me
```

Requires an active authentication session.

---

### Logout

```http
POST /api/auth/logout
```

---

# 👕 Product API

### Get All Products

```http
GET /api/products
```

### Get Product

```http
GET /api/products/:id
```

### Get Products by Category

```http
GET /api/products?category=men
```

Product data includes information such as:

* Name
* Description
* Price
* Discount price
* Images
* Category
* Available sizes
* Available colors
* Rating

---

# 🗂️ Category API

### Get Categories

```http
GET /api/categories
```

Categories:

```text
Men
Women
Kids
Accessories
```

---

# 🛒 Cart API

Cart routes require authentication.

### Get Cart

```http
GET /api/cart
```

### Add Item

```http
POST /api/cart
```

Example:

```json
{
  "productId": "product-id",
  "size": "M",
  "quantity": 1
}
```

### Update Item

```http
PUT /api/cart/:itemId
```

### Remove Item

```http
DELETE /api/cart/:itemId
```

---

## Cart Logic

Cart items are stored in PostgreSQL.

A duplicate product/size combination is not inserted as a separate row.

For example:

```text
Product: Premium Panjabi
Size: M
Quantity: 2
```

Adding the same product and size again increases the existing quantity.

Different sizes are stored separately:

```text
Premium Panjabi — M — 2
Premium Panjabi — L — 1
```

---

# 📦 Order API

Orders require authentication.

### Create Order

```http
POST /api/orders
```

Example:

```json
{
  "customerName": "John Doe",
  "phone": "01700000000",
  "email": "john@example.com",
  "address": "House 10, Road 5",
  "city": "Dhaka",
  "area": "Mirpur"
}
```

---

### Get Order History

```http
GET /api/orders
```

---

### Get Order Details

```http
GET /api/orders/:id
```

---

# 💰 Server-Side Price Validation

The backend never trusts the total amount submitted by the frontend.

When an order is created:

1. Backend retrieves the user's cart.
2. Product prices are retrieved from PostgreSQL.
3. Active price is calculated.
4. Quantity is applied.
5. Final total is calculated on the server.
6. Order is created using the server-calculated amount.

This prevents users from manipulating the order total from the browser.

---

# 🔄 Order Transaction

Order creation uses a Prisma database transaction.

Conceptually:

```text
Create Order
     ↓
Create Order Items
     ↓
Calculate/Store Final Prices
     ↓
Clear Cart
     ↓
Commit Transaction
```

If any operation fails, the transaction is rolled back.

This keeps the order and cart data consistent.

---

# 🔐 Authentication Architecture

Better Auth handles:

* Password hashing
* User registration
* Login
* Session creation
* Session cookies
* Session validation
* Logout

The backend uses the Prisma adapter:

```javascript
prismaAdapter(prisma, {
  provider: "postgresql"
})
```

Session verification uses:

```javascript
auth.api.getSession({
  headers: fromNodeHeaders(req.headers)
});
```

Protected routes use authentication middleware before executing sensitive operations.

---

# 🍪 Session Cookies

Authentication is session-based.

The backend sends a session cookie after successful login or registration.

Frontend API requests use:

```javascript
credentials: "include"
```

The Express server enables credentialed CORS:

```text
credentials: true
```

The production frontend origin must be explicitly allowed through:

```env
FRONTEND_URL=https://aura-e-commers-client.vercel.app
```

---

# 🌐 CORS

Development:

```text
Frontend → http://localhost:3000
Backend  → http://localhost:5000
```

Production:

```text
Frontend → https://aura-e-commers-client.vercel.app
Backend  → https://aura-e-commers-server.onrender.com
```

The backend must allow the frontend origin and credentials.

---

# 🗃️ Database Models

The project uses the following main Prisma models:

```text
User
Product
Category
Cart
CartItem
Order
OrderItem
Session
Account
Verification
```

### Relationship Overview

```text
User
 │
 ├── Cart
 │    └── CartItem
 │          └── Product
 │
 └── Order
      └── OrderItem
            └── Product

Category
   │
   └── Product
```

---

# 🌱 Seed Data

The seed script creates approximately 40 realistic products.

### Men — 12

Examples:

* Jacquard Panjabi
* Silk Blend Festive Panjabi
* Pure Linen Shirt
* Oxford Formal Shirt
* Pique Polo
* Tapered Jeans
* Chino Trousers
* Oversized T-Shirt

### Women — 12

Examples:

* Dhakai Jamdani Saree
* Georgette Party Saree
* Lawn Three Piece
* Chanderi Silk Suit
* Block Printed Kurti
* Bohemian Maxi Dress

### Kids — 8

Examples:

* Boys' Panjabi & Pajama Set
* Striped Polo
* Graphic Adventure Tee
* Girls' Party Frock
* Floral Summer Dress
* Traditional Kurti Set

### Accessories — 8

Examples:

* Leather Messenger Bag
* Saffiano Tote
* Stainless Steel Watch
* Leather Wallet
* Italian Belt
* Polarized Aviator Sunglasses

---

# 🧪 API Testing

The project contains:

```text
test-api.js
```

Run:

```bash
node test-api.js
```

This can be used to verify important backend functionality such as:

* Database connectivity
* Authentication
* Product endpoints
* Cart operations
* Order creation

---

# 🏗️ Production Deployment

The backend can be deployed to Render.

### Build Command

```bash
npm install
```

### Start Command

```bash
npm start
```

Make sure the server uses:

```javascript
const PORT = process.env.PORT || 5000;
```

Render provides the production `PORT` automatically.

---

## Production Environment Variables

Set these in Render:

```env
DATABASE_URL=your-neon-database-url

BETTER_AUTH_SECRET=your-production-secret

BETTER_AUTH_URL=https://aura-e-commers-server.onrender.com

FRONTEND_URL=https://aura-e-commers-client.vercel.app
```

---

## 🔗 Related Project

Frontend repository:

```text
https://github.com/asadullah-studio/AURA-e-Commers-Client.git
```

Production frontend:

```text
https://aura-e-commers-client.vercel.app
```

Production backend:

```text
https://aura-e-commers-server.onrender.com
```

---

## 📄 License

This project is created for educational and portfolio purposes.

---

## 👨‍💻 Author

**Asadullah**

AURA Lifestyle — Full-Stack Clothing E-Commerce

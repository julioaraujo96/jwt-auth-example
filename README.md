# Authentication test project

This is an Express.js authentication API using JWT (JSON Web Token) and bcrypt for password hashing. The project includes user registration, login, and protected routes.

## 🚀 Features

- User authentication using **JWT**.
- Password hashing with **bcrypt**.
- Protected API routes requiring authentication.

## 📦 Installation

### **1. Clone the Repository**

```sh
git clone https://github.com/julioaraujo96/jwt-auth-example.git
cd jwt-auth-example/server
```

### **2. Install Dependencies**

```sh
pnpm install
```

### **3. Set Up Environment Variables**

Create or a `.env` file in the project root and add the following:

```env
PORT=3000

JWT_SECRET=
BCRYPT_SALT_ROUNDS=

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

```

Note: Can also do `mv example-env .env` and then fill in the details.

### **4. Run the Server**

In the root directory, make sure to run postgres container:

```sh
docker compose up -d
```

Setup prisma using:

```sh
pnpm db:setup
```

### **5. Run the Server**

```sh
pnpm dev
```

The API will start on `http://localhost:3000`

---

## 📌 API Endpoints

### **1. Authentication Routes** (`/api/auth`)

#### **Register a User**

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

✅ **Response:**

```json
{
  "token": "your_jwt_token"
}
```

#### **Login a User**

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

✅ **Response:**

```json
{
  "token": "your_jwt_token"
}
```

---

### **2. User Routes** (`/api/user`)

#### **Get Profile (Protected)**

**GET** `/api/user/profile`

✅ **Request Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

✅ **Response:**

```json
{
  "message": "This is a protected profile route",
  "user": { "userId": "some-uuid" }
}
```

❌ **Unauthorized Response:**

```json
{
  "message": "Unauthorized"
}
```

---

## 🛠 Project Structure

```
server/
│   main.ts
│   package.json
│   pnpm-lock.yaml
│   compose.yml
│   tsconfig.json
│   .env
│
├── prisma/
│   └── schema.prisma
│
└── src/
    ├── controllers/
    │   └── auth.controller.ts
    │   └── user.controller.ts
    ├── middlewares/
    │   └── auth.middleware.ts
    ├── repositories/
    │   └── user.repo.ts
    ├── routes/
    │   ├── auth.routes.ts
    │   ├── user.routes.ts
    │   ├── index.ts
    └── utils/
        └── jwt.ts
        └── db.ts
```

---

## 🔧 Tools & Technologies

- **Node.js** & **Express.js**
- **JWT (jsonwebtoken)** for authentication
- **bcrypt** for password hashing
- **Prisma** for database ORM
- **TypeScript** for type safety

---

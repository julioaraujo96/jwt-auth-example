# Authentication test project

This is an Express.js authentication API using JWT (JSON Web Token) and bcrypt for password hashing. The project includes user registration, login, refresh tokens, and protected routes.

## 🚀 Features

- User authentication using **JWT** with access and refresh tokens
- Secure refresh tokens stored in **HTTP-only cookies**
- Token rotation and revocation capabilities
- Password hashing with **bcrypt**
- Protected API routes requiring authentication

## 📦 Installation

### **1. Clone the Repository**

```sh
git clone https://github.com/your-repo/jwt-auth-example.git
cd jwt-auth-example
```

### **2. Install Dependencies**

```sh
pnpm install
```

### **3. Set Up Environment Variables**

Create a `.env` file in the project root and add the following:

```env
PORT=3000

JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_different_refresh_token_secret_here
JWT_LIFETIME=5m
JWT_REFRESHLIFETIME=7d
BCRYPT_SALT_ROUNDS=10

CORS_ORIGIN=http://localhost:8000

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
```

Note: You can also run `mv example-env .env` and then fill in the details.

### **4. Start the Database**

In the root directory, run the PostgreSQL container:

```sh
docker compose up -d
```

Setup Prisma using:

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
  "token": "your_jwt_access_token"
}
```

The refresh token is automatically set as an HTTP-only cookie.

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
  "token": "your_jwt_access_token"
}
```

The refresh token is automatically set as an HTTP-only cookie.

#### **Refresh Access Token**

**POST** `/api/auth/refresh`

No request body needed. The refresh token is sent automatically through the HTTP-only cookie.

✅ **Response:**

```json
{
  "token": "your_new_jwt_access_token"
}
```

A new refresh token is also set as an HTTP-only cookie.

#### **Logout**

**POST** `/api/auth/logout`

No request body needed. The refresh token is sent automatically through the HTTP-only cookie.

✅ **Response:**

```json
{
  "message": "Logged out successfully"
}
```

#### **Logout from All Devices (Protected)**

**POST** `/api/auth/logout-all`

✅ **Request Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_ACCESS_TOKEN"
}
```

✅ **Response:**

```json
{
  "message": "Logged out from all devices successfully"
}
```

---

### **2. User Routes** (`/api/user`)

#### **Get Profile (Protected)**

**GET** `/api/user/profile`

✅ **Request Headers:**

```json
{
  "Authorization": "Bearer YOUR_JWT_ACCESS_TOKEN"
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

## 🔌 Client-Side Integration

### **Authentication Flow**

1. **Login/Register**: When a user logs in or registers, your frontend receives an access token in the response and a refresh token is set as an HTTP-only cookie.

2. **Using the Access Token**: Include the access token in the Authorization header for protected requests:
   ```javascript
   fetch('/api/user/profile', {
     headers: {
       'Authorization': `Bearer ${accessToken}`
     },
     credentials: 'include' // Important for cookies
   });
   ```

3. **Token Refresh**: When the access token expires (typically after 5 minutes), make a request to the refresh endpoint:
   ```javascript
   async function refreshToken() {
     const response = await fetch('/api/auth/refresh', {
       method: 'POST',
       credentials: 'include' // Important for sending the refresh token cookie
     });
     
     if (response.ok) {
       const data = await response.json();
       return data.token; // The new access token
     } else {
       // Redirect to login if refresh fails
       window.location.href = '/login';
     }
   }
   ```

4. **Logout**: To log out, call the logout endpoint which will clear the refresh token cookie:
   ```javascript
   fetch('/api/auth/logout', {
     method: 'POST',
     credentials: 'include'
   });
   ```

5. **Handling Token Expiration**: In a real application, you'll need to detect when access tokens expire and refresh them automatically. A common approach is to use interceptors with your HTTP client:
   ```javascript
   // Example using axios
   axios.interceptors.response.use(
     response => response,
     async error => {
       const originalRequest = error.config;
       // If the error is due to an expired token (401) and we haven't tried to refresh yet
       if (error.response.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true;
         try {
           const newToken = await refreshToken();
           // Update the token in storage
           localStorage.setItem('accessToken', newToken);
           // Update the header and retry the request
           originalRequest.headers.Authorization = `Bearer ${newToken}`;
           return axios(originalRequest);
         } catch (refreshError) {
           // If refresh fails, redirect to login
           window.location.href = '/login';
           return Promise.reject(refreshError);
         }
       }
       return Promise.reject(error);
     }
   );
   ```

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
    ├── utils/
    │   └── jwt.ts
    │   └── db.ts
    │   └── tokenCleanup.ts

```

## 🔧 Tools & Technologies

- **Node.js** & **Express.js**
- **JWT (jsonwebtoken)** for authentication with refresh tokens
- **HTTP-only cookies** for secure token storage
- **bcrypt** for password hashing
- **Prisma** for database ORM
- **TypeScript** for type safety

## 🔒 Security Features

- **Access tokens** are short-lived (5 minutes by default)
- **Refresh tokens** stored in HTTP-only cookies (preventing JavaScript access)
- **Token rotation** on each refresh (preventing token reuse)
- **Token revocation** capabilities (for logout)
- **Database tracking** of refresh tokens for invalidation
- **Different secrets** for access and refresh tokens
# Authentication Backend

This project is a Node.js authentication backend built with Express and MongoDB. It supports email OTP verification, JWT-based login, refresh-token sessions, logout from one or all devices, and password reset using OTP.

## Features

- Register with `username`, `email`, and `password`
- Email verification with OTP
- Login with access token + refresh token cookie
- Refresh-token rotation with session tracking
- Get current logged-in user
- Logout from the current session
- Logout from all sessions
- Forgot-password flow with OTP
- Reset password with OTP
- Login protection with rate limiting and slowdown

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Token (`jsonwebtoken`)
- `cookie-parser`
- Nodemailer
- `express-rate-limit`
- `express-slow-down`

## Project Structure

```text
backend/
|-- server.js
|-- package.json
|-- .env
`-- src/
    |-- app.js
    |-- config/
    |   `-- config.js
    |-- controllers/
    |   `-- auth.controller.js
    |-- db/
    |   `-- db.js
    |-- middleware/
    |   `-- rateLimiter.js
    |-- models/
    |   |-- otp.model.js
    |   |-- session.model.js
    |   `-- user.model.js
    |-- routes/
    |   `-- auth.routes.js
    |-- services/
    |   `-- email.services.js
    `-- utils/
        `-- utils.js
```

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file inside `backend/` and add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_gmail_address
GOOGLE_PASS=your_gmail_app_password
```

## Run Locally

```bash
cd backend
npm run dev
```

Server runs on:

```text
http://localhost:3000
```

Base route:

```text
/api/auth
```

## API Endpoints

### 1. Register

`POST /api/auth/register`

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "123456"
}
```

Creates a user, hashes the password, stores an OTP, and sends the OTP to the user's email.

### 2. Verify Email

`POST /api/auth/verify-email`

```json
{
  "email": "demo@example.com",
  "otp": "123456"
}
```

Marks the user as verified if the OTP is valid.

### 3. Resend OTP

`POST /api/auth/resend-otp`

```json
{
  "email": "demo@example.com"
}
```

Generates and sends a new OTP.

### 4. Login

`POST /api/auth/login`

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

Returns:

- User details
- Access token in the response body
- Refresh token in an HTTP-only cookie

### 5. Get Current User

`GET /api/auth/get-me`

Header:

```text
Authorization: Bearer <access_token>
```

Returns the logged-in user's basic profile.

### 6. Refresh Token

`POST /api/auth/refresh-token`

Reads the refresh token from cookies, validates the stored session, rotates the refresh token, and returns a new access token.

### 7. Logout

`POST /api/auth/logout`

Revokes the current session and clears the refresh-token cookie.

### 8. Logout All

`POST /api/auth/logout-all`

Revokes all active sessions for the current user and clears the refresh-token cookie.

### 9. Forget Password

`POST /api/auth/forget-password`

```json
{
  "email": "demo@example.com"
}
```

Sends an OTP for password reset.

### 10. Reset Password

`POST /api/auth/reset-password`

```json
{
  "email": "demo@example.com",
  "otp": "123456",
  "password": "newpassword123"
}
```

Validates the OTP and updates the password.

## Authentication Flow

1. Register a new user.
2. Verify the email using the OTP sent by email.
3. Log in to get an access token and refresh token cookie.
4. Use the access token for protected requests like `get-me`.
5. Use the refresh endpoint when the access token expires.
6. Log out from one device or all devices.
7. If the user forgets the password, request an OTP and reset it.

## Important Notes

- Passwords are hashed using SHA-256 before being stored.
- Refresh tokens are hashed before being stored in the `sessions` collection.
- OTP documents expire automatically after 5 minutes.
- Login is limited to 5 attempts per minute per IP + email combination.
- A slowdown is applied after repeated login attempts.
- Refresh tokens are stored in cookies with `httpOnly`, `secure`, and `sameSite: "strict"`.
- Because the cookie is marked `secure`, it works best over HTTPS or behind a trusted proxy.
- Email sending is configured with Gmail OAuth2 credentials.

## Available Scripts

```bash
npm run dev
```

Starts the backend using `nodemon`.

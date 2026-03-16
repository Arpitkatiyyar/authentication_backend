# Authentication API

A Node.js and Express authentication backend with MongoDB, JWT-based sessions, refresh-token rotation, and email OTP verification.

## Features

- User registration with hashed password storage
- Email verification using OTP
- Login with short-lived access tokens
- Refresh-token rotation with session tracking
- Logout from current session
- Logout from all active sessions
- Protected user profile endpoint

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- Cookies with `cookie-parser`
- Nodemailer for OTP emails

## Project Structure

```text
.
|-- server.js
|-- src
|   |-- app.js
|   |-- config
|   |   `-- config.js
|   |-- controllers
|   |   `-- auth.controller.js
|   |-- db
|   |   `-- db.js
|   |-- models
|   |   |-- otp.model.js
|   |   |-- session.model.js
|   |   `-- user.model.js
|   |-- routes
|   |   `-- auth.routes.js
|   |-- services
|   |   `-- email.services.js
|   `-- utils
|       `-- utils.js
`-- package.json
```

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root and add:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_gmail_address
GOOGLE_PASS=your_gmail_app_password_or_password
```

## Run Locally

```bash
npm run dev
```

The server starts on:

```text
http://localhost:3000
```

## API Endpoints

Base route:

```text
/api/auth
```

### 1. Register

`POST /api/auth/register`

Request body:

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "123456"
}
```

Creates a new user, stores a hashed password, generates an OTP, and sends the OTP to the user's email.

### 2. Verify Email

`POST /api/auth/verify-email`

Request body:

```json
{
  "email": "demo@example.com",
  "otp": "123456"
}
```

Marks the user as verified when the OTP matches.

### 3. Resend OTP

`POST /api/auth/resend-otp`

Request body:

```json
{
  "email": "demo@example.com"
}
```

Generates and sends a new OTP to the user's email.

### 4. Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

Returns:

- An access token in the response body
- A refresh token in an HTTP-only cookie

### 5. Get Current User

`GET /api/auth/get-me`

Headers:

```text
Authorization: Bearer <access_token>
```

Returns the authenticated user's basic profile.

### 6. Refresh Access Token

`POST /api/auth/refresh-token`

Reads the refresh token from cookies, validates the session, rotates the refresh token, and returns a new access token.

### 7. Logout

`POST /api/auth/logout`

Revokes the current refresh-token session and clears the cookie.

### 8. Logout All Sessions

`POST /api/auth/logout-all`

Revokes all active sessions for the logged-in user and clears the cookie.

## Authentication Flow

1. Register with username, email, and password.
2. Verify the email using the OTP sent to the inbox.
3. Log in to receive an access token and refresh token cookie.
4. Use the access token for protected routes.
5. Use the refresh endpoint when the access token expires.
6. Log out from one session or all sessions when needed.

## Notes

- Passwords are hashed using SHA-256 before storage.
- Refresh tokens are hashed before being stored in the database.
- Sessions store IP address and user agent information.
- Cookies are configured as `httpOnly`, `secure`, and `sameSite: "strict"`.
- Email delivery is configured with Gmail OAuth2 in the current implementation.

## Available Script

```bash
npm run dev
```

Starts the server with `nodemon`.

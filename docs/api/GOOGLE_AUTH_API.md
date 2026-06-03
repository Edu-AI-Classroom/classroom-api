# Google OAuth Authentication API

## Overview

Google OAuth 2.0 login flow for the Edu-AI Classroom platform. Users can sign in with their Google account. If it's their first time, a new account is created automatically (role: `STUDENT`). If they already registered with the same email via email/password, the existing account is linked.

**Base URL:** `/api/auth`

**Flow type:** Server-side OAuth redirect flow (not a REST call from frontend). The frontend opens the initiate URL in a new window or redirects the browser; Google handles the consent screen; the callback returns a JWT.

---

## Flow Diagram

```
Frontend                    Server (NestJS)              Google
   │                             │                          │
   │  1. Open /api/auth/google   │                          │
   │ ──────────────────────────► │                          │
   │                             │  2. 302 Redirect         │
   │  ◄──────────────────────────│ ───────────────────────  │
   │                             │                          │
   │  3. User consents on Google consent screen             │
   │ ───────────────────────────────────────────────────►   │
   │                             │                          │
   │                             │  4. Redirect to callback │
   │  ◄───────────────────────────────────────────────────  │
   │                             │                          │
   │  5. GET /api/auth/google/callback?code=...&state=...   │
   │ ──────────────────────────► │                          │
   │                             │                          │
   │  6. 200 { access_token, user }                         │
   │  ◄──────────────────────────│                          │
```

---

## Endpoints

### 1. Initiate Google OAuth

```
GET /api/auth/google
```

**Description:** Redirects the user to Google's OAuth consent screen. The user authorizes the app, then Google redirects back to the callback URL.

**Authentication:** None (public route)

**Scopes requested:** `email`, `profile`

**Response:** `302 Redirect` — the browser is automatically redirected to Google. No body to parse.

#### Frontend Implementation

```typescript
// Option A: Open in a new popup window (recommended)
function loginWithGoogle() {
  const width = 500;
  const height = 600;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;

  const popup = window.open(
    'http://localhost:8080/api/auth/google',
    'Google Login',
    `width=${width},height=${height},top=${top},left=${left}`,
  );

  // Listen for the callback message
  window.addEventListener('message', (event) => {
    if (event.origin !== 'http://localhost:8080') return;
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      const { access_token, expires_in, user } = event.data;
      localStorage.setItem('access_token', access_token);
      popup?.close();
      // navigate to dashboard
    }
  });
}

// Option B: Full-page redirect
function loginWithGoogle() {
  window.location.href = 'http://localhost:8080/api/auth/google';
}
```

> **Note:** With Option B, the callback response returns directly to the browser. Your frontend should handle the callback URL (`/auth/google/callback`) by parsing the response and storing the token.

---

### 2. Google OAuth Callback

```
GET /api/auth/google/callback
```

**Description:** Google redirects here after the user authorizes. The server validates the OAuth code with Google, finds or creates the user in the database, and returns a JWT.

**Authentication:** None (public route — Google's redirect carries the `code` query parameter)

**Query Parameters:** (set by Google, not by you)

| Parameter | Description                                  |
| --------- | -------------------------------------------- |
| `code`    | OAuth authorization code from Google         |
| `state`   | Optional state parameter for CSRF protection |

**Success Response:** `200 OK`

```json
{
  "message": "Đăng nhập Google thành công",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "7d",
  "user": {
    "userId": 42,
    "userName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "role": "STUDENT",
    "profilePicture": "https://lh3.googleusercontent.com/...",
    "isActive": true,
    "credit": 0
  }
}
```

**Error Response:** `401 Unauthorized`

```json
{
  "statusCode": 401,
  "message": "Google authentication failed",
  "error": "UNAUTHORIZED"
}
```

---

## User Object

| Field            | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `userId`         | `number`  | Unique user ID                         |
| `userName`       | `string`  | Display name (from Google profile)     |
| `email`          | `string`  | Email (unique, matches Google account) |
| `role`           | `string`  | `"STUDENT"` or `"TEACHER"`             |
| `profilePicture` | `string`  | URL to profile photo (from Google)     |
| `isActive`       | `boolean` | Whether the account is active          |
| `credit`         | `number`  | Credit balance (default: 0)            |

---

## Full Frontend Integration Example (React)

```typescript
// auth.ts — API functions
const API_BASE = 'http://localhost:8080/api';

export function loginWithGoogle(): void {
  window.location.href = `${API_BASE}/auth/google`;
}

export interface AuthUser {
  userId: number;
  userName: string;
  email: string;
  role: string;
  profilePicture: string | null;
  isActive: boolean;
  credit: number;
}

export interface GoogleAuthCallbackResponse {
  message: string;
  access_token: string;
  expires_in: string;
  user: AuthUser;
}

export function parseGoogleCallback(): GoogleAuthCallbackResponse | null {
  // After Google redirects back, the server returns JSON
  // If you used a popup, use postMessage instead
  const stored = sessionStorage.getItem('google_auth_response');
  if (stored) {
    sessionStorage.removeItem('google_auth_response');
    return JSON.parse(stored);
  }
  return null;
}
```

```tsx
// LoginPage.tsx
import { loginWithGoogle } from './auth';

export default function LoginPage() {
  return (
    <div>
      <h1>Đăng nhập</h1>

      {/* Existing email/password form */}
      {/* ... */}

      <div className="divider">HOẶC</div>

      <button onClick={loginWithGoogle} className="google-btn">
        <img src="/google-icon.svg" alt="" />
        Đăng nhập với Google
      </button>
    </div>
  );
}
```

```tsx
// GoogleCallbackPage.tsx — rendered at /auth/google/callback
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // The server already processed the callback and returned JSON.
    // If using full-page redirect, the response is the page body.
    // For popup flow, use window.opener.postMessage instead.
    try {
      const data = JSON.parse(document.body.innerText);
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        window.opener?.postMessage(
          { type: 'GOOGLE_AUTH_SUCCESS', ...data },
          window.location.origin,
        );
      }
    } catch {
      // fallback
    }
  }, []);

  return <p>Đang xác thực...</p>;
}
```

---

## Using the JWT After Login

Include the `access_token` in all authenticated requests:

```typescript
const token = localStorage.getItem('access_token');

fetch('http://localhost:8080/api/auth/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

---

## Environment Variables

The server requires these environment variables (already configured in `.env`):

| Variable               | Description                           | Example                                          |
| ---------------------- | ------------------------------------- | ------------------------------------------------ |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                | `1090867674419-....apps.googleusercontent.com`   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret            | `GOCSPX-...`                                     |
| `GOOGLE_CALLBACK_URL`  | URL Google redirects to after consent | `http://localhost:8080/api/auth/google/callback` |

> **Note:** The `GOOGLE_CALLBACK_URL` must match exactly what you registered in the Google Cloud Console under **Authorized redirect URIs**. Include the `/api` prefix since the server uses `setGlobalPrefix('api')`.

---

## Error Handling

| Scenario                                             | HTTP Status                | Frontend Action                                     |
| ---------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| User denies Google consent                           | Google shows its own error | No server-side error                                |
| Google API failure                                   | `401`                      | Show "Google login failed, try again"               |
| Email already exists (registered via email/password) | `200`                      | Works fine — existing account is linked, JWT issued |
| Invalid/expired OAuth code                           | `401`                      | Redirect back to login page                         |

---

## Notes

- New Google users are created with `role: "STUDENT"` and `password_hash: null`. They cannot use email/password login unless they set a password later.
- Existing users who registered via email/password and then log in with Google (same email) will get their existing account — no duplicate is created.
- The JWT expiration is controlled by `auth.jwt.expiresIn` in config (default: `7d`).
- Swagger docs also document these endpoints at `http://localhost:8080/api/docs`.

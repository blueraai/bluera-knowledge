# JWT Authentication in Node.js: A Complete Guide

## What is JWT?

JSON Web Tokens (JWT) are an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. JWTs are commonly used for authentication and authorization.

## Structure of a JWT

A JWT consists of three parts separated by dots:

```
header.payload.signature
```

- **Header**: Contains the token type and signing algorithm
- **Payload**: Contains claims (user data)
- **Signature**: Verifies the token hasn't been tampered with

## Implementing JWT Authentication

### Installation

```bash
npm install jsonwebtoken bcryptjs
```

### Creating Tokens

```javascript
const jwt = require('jsonwebtoken')

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
}
```

### Verifying Tokens

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}
```

### Refresh Token Flow

```javascript
app.post('/token/refresh', (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' })
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid refresh token' })
    }

    const accessToken = generateAccessToken({ id: user.userId })
    res.json({ accessToken })
  })
})
```

## Security Best Practices

1. **Use short expiration times** for access tokens (15 minutes)
2. **Store refresh tokens securely** (httpOnly cookies)
3. **Implement token revocation** for logout
4. **Use strong secrets** (at least 256 bits)
5. **Always use HTTPS** in production

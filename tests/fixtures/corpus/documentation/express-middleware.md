# Express Middleware Guide

## What is Middleware?

Middleware functions are functions that have access to the request object (`req`), the response object (`res`), and the `next` function in the application's request-response cycle.

Middleware functions can:
- Execute any code
- Make changes to the request and response objects
- End the request-response cycle
- Call the next middleware in the stack

## Application-level Middleware

Bind application-level middleware to an instance of the app object using `app.use()` and `app.METHOD()`.

```javascript
const express = require('express')
const app = express()

// Middleware with no mount path - executed for every request
app.use((req, res, next) => {
  console.log('Time:', Date.now())
  next()
})

// Middleware mounted on /user/:id
app.use('/user/:id', (req, res, next) => {
  console.log('Request Type:', req.method)
  next()
})
```

## Error-handling Middleware

Error-handling middleware always takes four arguments:

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
```

## Built-in Middleware

Express has built-in middleware functions:

- `express.static` - serves static assets
- `express.json` - parses JSON payloads
- `express.urlencoded` - parses URL-encoded payloads

```javascript
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
```

## Third-party Middleware

Common third-party middleware:

```javascript
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
```

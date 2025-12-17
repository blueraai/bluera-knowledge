# Express Routing Guide

## Basic Routing

Routing refers to how an application's endpoints (URIs) respond to client requests.

```javascript
const express = require('express')
const app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
  res.send('hello world')
})

// POST method route
app.post('/', (req, res) => {
  res.send('POST request to the homepage')
})
```

## Route Methods

Express supports methods that correspond to all HTTP request methods: `get`, `post`, `put`, `delete`, `patch`, etc.

```javascript
app.get('/user/:id', (req, res) => {
  res.send(`User ${req.params.id}`)
})

app.put('/user/:id', (req, res) => {
  res.send(`Updated user ${req.params.id}`)
})

app.delete('/user/:id', (req, res) => {
  res.send(`Deleted user ${req.params.id}`)
})
```

## Route Parameters

Route parameters are named URL segments used to capture values at specific positions in the URL.

```javascript
// Route path: /users/:userId/books/:bookId
// Request URL: /users/34/books/8989
// req.params: { "userId": "34", "bookId": "8989" }

app.get('/users/:userId/books/:bookId', (req, res) => {
  res.send(req.params)
})
```

## Route Handlers

You can provide multiple callback functions that behave like middleware:

```javascript
app.get('/example/b', (req, res, next) => {
  console.log('the response will be sent by the next function ...')
  next()
}, (req, res) => {
  res.send('Hello from B!')
})
```

## express.Router

Use the `express.Router` class to create modular, mountable route handlers.

```javascript
const router = express.Router()

router.get('/', (req, res) => {
  res.send('Birds home page')
})

router.get('/about', (req, res) => {
  res.send('About birds')
})

module.exports = router
```

# Node.js Streams Guide

## What are Streams?

Streams are collections of data that might not be available all at once and don't have to fit in memory. They're ideal for working with large amounts of data or data from external sources.

## Types of Streams

1. **Readable** - streams from which data can be read (e.g., `fs.createReadStream()`)
2. **Writable** - streams to which data can be written (e.g., `fs.createWriteStream()`)
3. **Duplex** - streams that are both Readable and Writable (e.g., `net.Socket`)
4. **Transform** - Duplex streams that can modify data as it passes through

## Reading from Streams

```javascript
const fs = require('fs')

const readStream = fs.createReadStream('large-file.txt', 'utf8')

readStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length, 'bytes')
})

readStream.on('end', () => {
  console.log('Finished reading')
})

readStream.on('error', (err) => {
  console.error('Error:', err)
})
```

## Writing to Streams

```javascript
const fs = require('fs')

const writeStream = fs.createWriteStream('output.txt')

writeStream.write('Hello, ')
writeStream.write('World!')
writeStream.end()

writeStream.on('finish', () => {
  console.log('Finished writing')
})
```

## Piping Streams

The `pipe()` method connects a readable stream to a writable stream:

```javascript
const fs = require('fs')

const readStream = fs.createReadStream('input.txt')
const writeStream = fs.createWriteStream('output.txt')

readStream.pipe(writeStream)
```

## Transform Streams

```javascript
const { Transform } = require('stream')

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase())
    callback()
  }
})

process.stdin
  .pipe(upperCaseTransform)
  .pipe(process.stdout)
```

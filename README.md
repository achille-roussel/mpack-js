mpack-js
========

Browser-oriented javascript implementation of MessagePack encoder and decoder.

Usage
-----

Here's a simple example of how to use mpack-js:
```js
var mpack = require('mpack-js')

var bytes = mpack.encode({
    "hello" : "world",
    "answer": 42,
})

var object = mpack.decode(bytes)

console.log(object.answer) // 42
```

You can also use the Encoder and Decoder objects to build MessagePack messages
from a sequence of multiple objects:
```js
var mpack = require('mpack-js')

var encoder = new mpack.Encoder()

encoder.encode('hello')
encoder.encode(42)
encoder.encode([1, 2, 3])

var decoder = new mpack.Decoder(encoder.flush())
var object  = null

object = decoder.decode() // hello
object = decoder.decode() // 42
object = decoder.decode() // [1, 2, 3]
object = decoder.decode() // undefined
```

MessagePack Extensions
----------------------

MessagePack supports encoding *extended* types to embed arbitrary data into a
serialized message.
Here's a quick example showing how to use extended types with mpack-js:
```js
var mpack = require('mpack-js')

var data = new Uint8Array(...) // some pre-serialized data
var type = 42 // must be an integer in the range [-128; 127]

// Encode the given binary data as an extended data type using MessagePack
// extension support.
var bytes = mpack.encode(new mpack.Extended(type, data))

// Decode works like any other data type, the returned object has two fields
// named data and type.
var object = mpack.decode(bytes)

console.log(object.type) // 42
console.log(object.data) // Uint8Array
```

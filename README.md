mpack-js
========

Browser-oriented javascript implementation of MessagePack encoder and decoder.

Usage
-----

Here's a simple example of how to use mpack-js:
```js
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
var encoder = mpack.Encoder()

encoder.encode('hello')
encoder.encode(42)
encoder.encode([1, 2, 3])

var decoder = mpack.Decoder(encoder.flush())
var object  = null

object = decoder.decode() // hello
object = decoder.decode() // 42
object = decoder.decode() // [1, 2, 3]
object = decoder.decode() // undefined
```

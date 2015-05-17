'use strict'

var assert = require('assert')
var mpack  = require('../index.js')

describe('mpack: encode/decode', function () {
  describe('nil', function () {
    it('encodes and decodes null', function () {
      var bytes = mpack.encode(null)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 1)
      assert(value === null)
    })
  })

  describe('true', function () {
    it('encodes an decodes true', function () {
      var bytes = mpack.encode(true)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 1)
      assert(value === true)
    })
  })

  describe('false', function () {
    it('encodes an decodes false', function () {
      var bytes = mpack.encode(false)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 1)
      assert(value === false)
    })
  })

  describe('fixstr', function () {
    it('encodes and decodes a 15 bytes string', function () {
      var bytes = mpack.encode('hello\u2022world!')
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 15)
      assert(value === 'hello\u2022world!')
    })
  })

  describe('str8', function () {
    it('encodes and decodes a 59 bytes string', function () {
      var string = (new Array(20)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 59)
      assert(value === string)
    })
  })

  describe('str16', function () {
    it('encodes and decodes a 3 KB string', function () {
      var string = (new Array(1000)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 3000)
      assert(value === string)
    })
  })

  describe('str32', function () {
    it('encodes and decodes a 100 KB string', function () {
      var string = (new Array(100000)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 300002)
      assert(value === string)
    })
  })

  describe('bin8', function () {
    it('encodes and decodes a 20 B byte array', function () {
      var binary = new Uint8Array(20)
      var bytes  = undefined
      var value  = undefined
      var index  = undefined

      for (index = 0; index != 20; ++index) {
        binary[index] = index % 256
      }

      bytes = mpack.encode(binary)
      value = mpack.decode(bytes)

      assert(bytes.byteLength == 22)
      assert(value.byteLength == 20)

      for (index = 0; index != 20; ++index) {
        assert(value[index] == (index % 256))
      }
    })
  })

  describe('bin16', function () {
    it('encodes and decodes a 1 KB byte array', function () {
      var binary = new Uint8Array(1000)
      var bytes  = undefined
      var value  = undefined
      var index  = undefined

      for (index = 0; index != 1000; ++index) {
        binary[index] = index % 256
      }

      bytes = mpack.encode(binary)
      value = mpack.decode(bytes)

      assert(bytes.byteLength == 1003)
      assert(value.byteLength == 1000)

      for (index = 0; index != 1000; ++index) {
        assert(value[index] == (index % 256))
      }
    })
  })

  describe('bin32', function () {
    it('encodes and decodes a 100 KB byte array', function () {
      var binary = new Uint8Array(100000)
      var bytes  = undefined
      var value  = undefined
      var index  = undefined

      for (index = 0; index != 100000; ++index) {
        binary[index] = index % 256
      }

      bytes = mpack.encode(binary)
      value = mpack.decode(bytes)

      assert(bytes.byteLength == 100005)
      assert(value.byteLength == 100000)

      for (index = 0; index != 100000; ++index) {
        assert(value[index] == (index % 256))
      }
    })
  })

  describe('positive fixnum', function () {
    it('encodes and decodes a positive fixnum integer', function () {
      var bytes = mpack.encode(0)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 1)
      assert(value === 0)
    })
  })

  describe('negative fixnum', function () {
    it('encodes and decodes a negative fixnum integer', function () {
      var bytes = mpack.encode(-1)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 1)
      assert(value === -1)
    })
  })

  describe('int8', function () {
    it('encodes and decodes a 8 bits signed integer', function () {
      var bytes = mpack.encode(-128)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 2)
      assert(value === -128)
    })
  })

  describe('int16', function () {
    it('encodes and decodes a 16 bits signed integer', function () {
      var bytes = mpack.encode(-32768)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 3)
      assert(value === -32768)
    })
  })

  describe('int32', function () {
    it('encodes and decodes a 32 bits signed integer', function () {
      var bytes = mpack.encode(-2147483648)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 5)
      assert(value === -2147483648)
    })
  })

  describe('uint8', function () {
    it('encodes and decodes a 8 bits unsigned integer', function () {
      var bytes = mpack.encode(255)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 2)
      assert(value === 255)
    })
  })

  describe('uint16', function () {
    it('encodes and decodes a 16 bits unsigned integer', function () {
      var bytes = mpack.encode(65535)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 3)
      assert(value === 65535)
    })
  })

  describe('uint32', function () {
    it('encodes and decodes a 32 bits unsigned integer', function () {
      var bytes = mpack.encode(4294967295)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 5)
      assert(value === 4294967295)
    })
  })

  describe('float64', function () {
    it('encodes and decodes a 64 bits floating point number', function () {
      var bytes = mpack.encode(1.234)
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 9)
      assert(value === 1.234)
    })
  })

  describe('fixarray', function () {
    it('encodes and decodes an array of length 3', function () {
      var bytes = mpack.encode([null, true, 0])
      var value = mpack.decode(bytes)
      assert(bytes.byteLength === 4)
      assert(value.length === 3)
      assert(value[0] === null)
      assert(value[1] === true)
      assert(value[2] === 0)
    })
  })

  describe('array16', function () {
    it('encodes and decodes a array of length 20', function () {
      var array = new Array(20)
      var index = undefined
      var bytes = undefined
      var value = undefined

      for (index = 0; index != 20; ++index) {
        array[index] = null;
      }

      bytes = mpack.encode(array)
      value = mpack.decode(bytes)
      assert(bytes.byteLength === 23)
      assert(value.length === 20)

      for (index = 0; index != 20; ++index) {
        assert(value[index] === null)
      }
    })
  })

  describe('array32', function () {
    it('encodes and decodes a array of length 100000', function () {
      var array = new Array(100000)
      var index = undefined
      var bytes = undefined
      var value = undefined

      for (index = 0; index != 100000; ++index) {
        array[index] = null;
      }

      bytes = mpack.encode(array)
      value = mpack.decode(bytes)
      assert(bytes.byteLength === 100005)
      assert(value.length === 100000)

      for (index = 0; index != 100000; ++index) {
        assert(value[index] === null)
      }
    })
  })

  describe('fixmap', function () {
    it('encodes and decodes an map of length 1', function () {
      var bytes = mpack.encode({'hello': 'world'})
      var value = mpack.decode(bytes)
      var key   = undefined
      var count = 0

      assert(bytes.byteLength === 13)

      for (key in value) {
        assert(key == 'hello')
        assert(value[key] == 'world')
        ++count
      }

      assert(count == 1)
    })
  })

  describe('map16', function () {
    it('encodes and decodes a map of length 10', function () {
      var object = { }
      var string = "01234567890123456789";
      var bytes  = undefined
      var key    = undefined
      var value  = undefined
      var count  = 0

      for (key in string) {
        object[key] = string[key];
      }

      bytes = mpack.encode(object)
      value = mpack.decode(bytes)

      for (key in value) {
        assert(key == count)
        assert(value[key] == string[key])
        ++count
      }

      assert(count == string.length)
    })
  })

  describe('map32', function () {
    it('encodes and decodes a map of length 100000', function () {
      var object = { }
      var string = (new Array(100000)).join('a');
      var bytes  = undefined
      var key    = undefined
      var value  = undefined
      var count  = 0

      for (key in string) {
        object[key] = string[key];
      }

      bytes = mpack.encode(object)
      value = mpack.decode(bytes)

      for (key in value) {
        assert(key == count)
        assert(value[key] == string[key])
        ++count
      }

      assert(count == string.length)
    })
  })

  describe('fixext1', function () {
    it('encodes and decodes a fixext1 extended type', function () {
      var object = new Uint8Array([42])
      var bytes  = mpack.encode(new mpack.Extended(10, object))
      var value  = mpack.decode(bytes)

      assert(bytes.byteLength === 3)
      assert(value.type === 10)
      assert(value.data.byteLength === 1)
      assert(value.data[0] === 42)
    })
  })

  describe('fixext2', function () {
    it('encodes and decodes a fixext2 extended type', function () {
      var object = new Uint8Array([1, 2])
      var bytes  = mpack.encode(new mpack.Extended(10, object))
      var value  = mpack.decode(bytes)

      assert(bytes.byteLength === 4)
      assert(value.type === 10)
      assert(value.data.byteLength === 2)
      assert(value.data[0] === 1)
      assert(value.data[1] === 2)
    })
  })

  describe('fixext4', function () {
    it('encodes and decodes a fixext4 extended type', function () {
      var object = new Uint8Array([1, 2, 3, 4])
      var bytes  = mpack.encode(new mpack.Extended(10, object))
      var value  = mpack.decode(bytes)

      assert(bytes.byteLength === 6)
      assert(value.type === 10)
      assert(value.data.byteLength === 4)
      assert(value.data[0] === 1)
      assert(value.data[1] === 2)
      assert(value.data[2] === 3)
      assert(value.data[3] === 4)
    })
  })

  describe('fixext8', function () {
    it('encodes and decodes a fixext8 extended type', function () {
      var object = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      var bytes  = mpack.encode(new mpack.Extended(10, object))
      var value  = mpack.decode(bytes)
      var index  = undefined

      assert(bytes.byteLength === 10)
      assert(value.type === 10)
      assert(value.data.byteLength === 8)

      for (index = 0; index != 8; ++index) {
        assert(value.data[index] === (index + 1))
      }
    })
  })

  describe('fixext16', function () {
    it('encodes and decodes a fixext16 extended type', function () {
      var object = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      var bytes  = mpack.encode(new mpack.Extended(10, object))
      var value  = mpack.decode(bytes)
      var index  = undefined

      assert(bytes.byteLength === 18)
      assert(value.type === 10)
      assert(value.data.byteLength === 16)

      for (index = 0; index != 16; ++index) {
        assert(value.data[index] === (index + 1))
      }
    })
  })

  describe('ext8', function () {
    it('encodes and decodes an ext8 extended type', function () {
      var object = new Uint8Array(20)
      var index  = undefined
      var bytes  = undefined
      var value  = undefined

      for (index = 0; index != 20; ++index) {
        object[index] = (index % 256)
      }

      bytes = mpack.encode(new mpack.Extended(10, object))
      value = mpack.decode(bytes)

      assert(value.type == 10)
      assert(value.data.byteLength == 20)

      for (index = 0; index != 20; ++index) {
        assert(value.data[index] == (index % 256))
      }
    })
  })

  describe('ext16', function () {
    it('encodes and decodes an ext16 extended type', function () {
      var object = new Uint8Array(1000)
      var index  = undefined
      var bytes  = undefined
      var value  = undefined

      for (index = 0; index != 1000; ++index) {
        object[index] = (index % 256)
      }

      bytes = mpack.encode(new mpack.Extended(10, object))
      value = mpack.decode(bytes)

      assert(value.type == 10)
      assert(value.data.byteLength == 1000)

      for (index = 0; index != 1000; ++index) {
        assert(value.data[index] == (index % 256))
      }
    })
  })

  describe('ext32', function () {
    it('encodes and decodes an ext32 extended type', function () {
      var object = new Uint8Array(100000)
      var index  = undefined
      var bytes  = undefined
      var value  = undefined

      for (index = 0; index != 100000; ++index) {
        object[index] = (index % 256)
      }

      bytes = mpack.encode(new mpack.Extended(10, object))
      value = mpack.decode(bytes)

      assert(value.type == 10)
      assert(value.data.byteLength == 100000)

      for (index = 0; index != 100000; ++index) {
        assert(value.data[index] == (index % 256))
      }
    })
  })
})

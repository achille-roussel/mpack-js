'using strict'

function MpackTestSuite() {

  this.assert = function(test) {
    if (!test) {
      throw 'Failed'
    }
  }

  this.tests = {
    "nil": function(self) {
      var bytes = mpack.encode(null)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 1)
      self.assert(value === null)
    },

    "true": function(self) {
      var bytes = mpack.encode(true)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 1)
      self.assert(value === true)
    },

    "false": function(self) {
      var bytes = mpack.encode(false)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 1)
      self.assert(value === false)
    },

    "fixstr": function(self) {
      var bytes = mpack.encode('hello\u2022world!')
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 15)
      self.assert(value === 'hello\u2022world!')
    },

    "str8": function(self) {
      var string = (new Array(20)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 59)
      self.assert(value === string)
    },

    "str16": function(self) {
      var string = (new Array(1000)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 3000)
      self.assert(value === string)
    },

    "str32": function(self) {
      var string = (new Array(100000)).join('\u2022')
      var bytes = mpack.encode(string)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 300002)
      self.assert(value === string)
    },

    "bin8": function(self) {
      var binary = new Uint8Array(20)
      for (var i = 0; i != 20; ++i) {
        binary[i] = i
      }

      var bytes = mpack.encode(binary)
      var value = mpack.decode(bytes)
      
      self.assert(bytes.byteLength == 22)
      self.assert(value.byteLength == 20)

      for (var i = 0; i != 20; ++i) {
        self.assert(value[i] == i)
      }
    },

    "bin16": function(self) {
      var binary = new Uint8Array(1000)
      for (var i = 0; i != 1000; ++i) {
        binary[i] = i % 256
      }

      var bytes = mpack.encode(binary)
      var value = mpack.decode(bytes)
      
      self.assert(bytes.byteLength == 1003)
      self.assert(value.byteLength == 1000)

      for (var i = 0; i != 1000; ++i) {
        self.assert(value[i] == (i % 256))
      }
    },

    "bin32": function(self) {
      var binary = new Uint8Array(100000)
      for (var i = 0; i != 100000; ++i) {
        binary[i] = i % 256
      }

      var bytes = mpack.encode(binary)
      var value = mpack.decode(bytes)
      
      self.assert(bytes.byteLength == 100005)
      self.assert(value.byteLength == 100000)

      for (var i = 0; i != 100000; ++i) {
        self.assert(value[i] == (i % 256))
      }
    },

    "fixnum.positive": function(self) {
      var bytes = mpack.encode(0)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 1)
      self.assert(value === 0)
    },

    "fixnum.negative": function(self) {
      var bytes = mpack.encode(-1)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 1)
      self.assert(value === -1)
    },

    "int8": function(self) {
      var bytes = mpack.encode(-128)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 2)
      self.assert(value === -128)
    },

    "int16": function(self) {
      var bytes = mpack.encode(-32768)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 3)
      self.assert(value === -32768)
    },

    "int32": function(self) {
      var bytes = mpack.encode(-2147483648)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 5)
      self.assert(value === -2147483648)
    },

    "uint8": function(self) {
      var bytes = mpack.encode(255)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 2)
      self.assert(value === 255)
    },

    "uint16": function(self) {
      var bytes = mpack.encode(65535)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 3)
      self.assert(value === 65535)
    },

    "uint32": function(self) {
      var bytes = mpack.encode(4294967295)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 5)
      self.assert(value === 4294967295)
    },

    "float64": function(self) {
      var bytes = mpack.encode(1.234)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 9)
      self.assert(value === 1.234)
    },

    "fixarray": function(self) {
      var bytes = mpack.encode([null, true, 0])
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 4)
      self.assert(value.length === 3)
      self.assert(value[0] === null)
      self.assert(value[1] === true)
      self.assert(value[2] === 0)
    },

    "array16": function(self) {
      var array = new Array(20)
      for (var i = 0; i != 20; ++i) {
        array[i] = null;
      }

      var bytes = mpack.encode(array)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 23)
      self.assert(value.length === 20)

      for (var i = 0; i != 20; ++i) {
        self.assert(value[i] === null)
      }
    },

    "array32": function(self) {
      var array = new Array(100000)
      for (var i = 0; i != 100000; ++i) {
        array[i] = null;
      }

      var bytes = mpack.encode(array)
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 100005)
      self.assert(value.length === 100000)

      for (var i = 0; i != 100000; ++i) {
        self.assert(value[i] === null)
      }
    },

    "fixmap": function(self) {
      var bytes = mpack.encode({'hello': 'world'})
      var value = mpack.decode(bytes)
      self.assert(bytes.byteLength === 13)

      var n = 0
      for (key in value) {
        self.assert(key == 'hello')
        self.assert(value[key] == 'world')
        n += 1
      }

      self.assert(n == 1)
    },

    "map16": function(self) {
      var object = { }
      var string = "01234567890123456789";

      for (c in string) {
        object[c] = string[c];
      }

      var bytes = mpack.encode(object)
      var value = mpack.decode(bytes)

      var i = 0
      for (key in value) {
        self.assert(key == i)
        self.assert(value[key] == string[i])
        i += 1
      }

      self.assert(i == string.length)
    },

    "map32": function(self) {
      var object = { }
      var string = (new Array(100000)).join('a');

      for (c in string) {
        object[c] = string[c];
      }

      var bytes = mpack.encode(object)
      var value = mpack.decode(bytes)

      var i = 0
      for (key in value) {
        self.assert(key == i)
        self.assert(value[key] == string[i])
        i += 1
      }

      self.assert(i == string.length)
    },

    "fixext1": function(self) {
      var object = new Uint8Array([42])
      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(bytes.byteLength === 3)
      self.assert(value.type === 10)
      self.assert(value.data.byteLength === 1)
      self.assert(value.data[0] === 42)
    },

    "fixext2": function(self) {
      var object = new Uint8Array([1, 2])
      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(bytes.byteLength === 4)
      self.assert(value.type === 10)
      self.assert(value.data.byteLength === 2)
      self.assert(value.data[0] === 1)
      self.assert(value.data[1] === 2)
    },

    "fixext4": function(self) {
      var object = new Uint8Array([1, 2, 3, 4])
      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(bytes.byteLength === 6)
      self.assert(value.type === 10)
      self.assert(value.data.byteLength === 4)
      self.assert(value.data[0] === 1)
      self.assert(value.data[1] === 2)
      self.assert(value.data[2] === 3)
      self.assert(value.data[3] === 4)
    },

    "fixext8": function(self) {
      var object = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(bytes.byteLength === 10)
      self.assert(value.type === 10)
      self.assert(value.data.byteLength === 8)

      for (var i = 0; i != 8; ++i) {
        self.assert(value.data[i] === (i + 1))
      }
    },

    "fixext16": function(self) {
      var object = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(bytes.byteLength === 18)
      self.assert(value.type === 10)
      self.assert(value.data.byteLength === 16)

      for (var i = 0; i != 16; ++i) {
        self.assert(value.data[i] === (i + 1))
      }
    },

    "ext8": function(self) {
      var object = new Uint8Array(20)
      for (var i = 0; i != 20; ++i) {
        object[i] = (i % 256)
      }

      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(value.type == 10)
      self.assert(value.data.byteLength == 20)

      for (var i = 0; i != 20; ++i) {
        self.assert(value.data[i] == (i % 256))
      }
    },

    "ext16": function(self) {
      var object = new Uint8Array(1000)
      for (var i = 0; i != 1000; ++i) {
        object[i] = (i % 256)
      }

      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(value.type == 10)
      self.assert(value.data.byteLength == 1000)

      for (var i = 0; i != 1000; ++i) {
        self.assert(value.data[i] == (i % 256))
      }
    },

    "ext32": function(self) {
      var object = new Uint8Array(100000)
      for (var i = 0; i != 100000; ++i) {
        object[i] = (i % 256)
      }

      var bytes = mpack.encode(new mpack.Extended(10, object))
      var value = mpack.decode(bytes)

      self.assert(value.type == 10)
      self.assert(value.data.byteLength == 100000)

      for (var i = 0; i != 100000; ++i) {
        self.assert(value.data[i] == (i % 256))
      }
    },

    "Encoder-Decoder": function(self) {
      var encoder = new mpack.Encoder()
      self.assert(encoder.encode('hello'))
      self.assert(encoder.encode('world'))
      self.assert(encoder.encode('!!!'))

      var decoder = new mpack.Decoder(encoder.flush())
      self.assert(decoder.decode() === 'hello')
      self.assert(decoder.decode() === 'world')
      self.assert(decoder.decode() === '!!!')
      self.assert(decoder.decode() === undefined)
    },
  }

  this.run = function() {
    console.log("running mpack test suite:")
    var count  = 0
    var failed = 0

    for (name in this.tests) {
      count += 1
      try {
        this.run_test(name)
        console.log("- " + name + " (OK)")
      }
      catch (e) {
        failed += 1
        console.log(e)
        console.log("- " + name + ": " + e)
      }
    }

    if (failed != 0) {
      console.log(failed + "/" + count + " test(s) failed!")
    }
  }

  this.run_test = function(name) {
    return this.tests[name](this)
  }
}

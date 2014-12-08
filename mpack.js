'using strict'

function mpack_encode_utf8__(s) {
  return unescape(encodeURIComponent(s))
}

function mpack_decode_utf8__(s) {
  return decodeURIComponent(escape(s))
}

function mpack_memcpy__(dst, src) {
  new Uint8Array(dst).set(new Uint8Array(src))
  return dst
}

var mpack = {
  "nil"     : 0xc0,
  "false"   : 0xc2,
  "true"    : 0xc3,
  "bin8"    : 0xc4,
  "bin16"   : 0xc5,
  "bin32"   : 0xc6,
  "ext8"    : 0xc7,
  "ext16"   : 0xc8,
  "ext32"   : 0xc9,
  "float32" : 0xca,
  "float64" : 0xcb,
  "uint8"   : 0xcc,
  "uint16"  : 0xcd,
  "uint32"  : 0xce,
  "uint64"  : 0xcf,
  "int8"    : 0xd0,
  "int16"   : 0xd1,
  "int32"   : 0xd2,
  "int64"   : 0xd3,
  "fixext1" : 0xd4,
  "fixext2" : 0xd5,
  "fixext4" : 0xd6,
  "fixext8" : 0xd7,
  "fixext16": 0xd8,
  "str8"    : 0xd9,
  "str16"   : 0xda,
  "str32"   : 0xdb,
  "array16" : 0xdc,
  "array32" : 0xdd,
  "map16"   : 0xde,
  "map32"   : 0xdf,
  "fixarray": 0x90,
  "fixstr"  : 0xa0,
  "fixmap"  : 0x80,
  "fixnum"  : {
    "positive": 0x00,
    "negative": 0xe0,
  },
  "Decoder" : null,
  "decode"  : null,
  "Encoder" : null,
  "encode"  : null,
  "Extended": null,
}

mpack.Decoder = function(buffer) {
  if (typeof(buffer) === ArrayBuffer) {
    this.buffer = buffer
    this.offset = 0
    this.view   = new DataView(this.buffer)
  }
  else { // expects an ArrayBufferView then
    this.buffer = null
    this.offset = 0
    this.view   = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }

  var decode_string_of_length = function(self, length) {
    var off = self.offset
    self.offset += length

    var buf = new Uint8Array(self.view.buffer, self.view.byteOffset + off, length)
    var str = ''

    for (var i = 0, n = buf.byteLength; i != n; ++i) {
      str += String.fromCharCode(buf[i])
    }

    return mpack_decode_utf8__(str)
  }

  var decode_fixstr = function(self, tag) {
    return decode_string_of_length(self, tag & ~mpack.fixstr)
  }

  var decode_str8 = function(self) {
    var length = self.view.getUint8(self.offset)
    self.offset += 1
    return decode_string_of_length(self, length)
  }

  var decode_str16 = function(self) {
    var length = self.view.getUint16(self.offset)
    self.offset += 2
    return decode_string_of_length(self, length)
  }

  var decode_str32 = function(self) {
    var length = self.view.getUint32(self.offset)
    self.offset += 4
    return decode_string_of_length(self, length)
  }

  var decode_bin8 = function(self) {
    var length = self.view.getUint8(self.offset)
    var offset = self.offset + 1
    self.offset = offset + length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_bin16 = function(self) {
    var length = self.view.getUint16(self.offset)
    var offset = self.offset + 2
    self.offset = offset + length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_bin32 = function(self) {
    var length = self.view.getUint32(self.offset)
    var offset = self.offset + 4
    self.offset = offset + length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_positive_fixnum = function(self, tag) {
    return tag
  }

  var decode_negative_fixnum = function(self, tag) {
    return self.view.getInt8(self.offset - 1)
  }

  var decode_int8 = function(self) {
    var value = self.view.getInt8(self.offset)
    self.offset += 1
    return value
  }

  var decode_int16 = function(self) {
    var value = self.view.getInt16(self.offset)
    self.offset += 2
    return value
  }

  var decode_int32 = function(self) {
    var value = self.view.getInt32(self.offset)
    self.offset += 4
    return value
  }

  var decode_int64 = function(self) {
    // TODO: maybe there's a more clever way to do this.
    throw new TypeError("mpack: javascript doesn't support 64 bits integer")
  }

  var decode_uint8 = function(self) {
    var value = self.view.getUint8(self.offset)
    self.offset += 1
    return value
  }

  var decode_uint16 = function(self) {
    var value = self.view.getUint16(self.offset)
    self.offset += 2
    return value
  }

  var decode_uint32 = function(self) {
    var value = self.view.getUint32(self.offset)
    self.offset += 4
    return value
  }

  var decode_uint64 = function(self) {
    // TODO: maybe there's a more clever way to do this.
    throw new TypeError("mpack: javascript doesn't support 64 bits integer")
  }

  var decode_float32 = function(self) {
    var value = self.view.getFloat32(self.offset)
    self.offset += 4
    return value
  }

  var decode_float64 = function(self) {
    var value = self.view.getFloat64(self.offset)
    self.offset += 8
    return value
  }

  var decode_array_of_length = function(self, length) {
    var array = new Array(length)

    for (var i = 0; i != length; ++i) {
      array[i] = decode_object(self)
    }

    return array
  }

  var decode_fixarray = function(self, tag) {
    return decode_array_of_length(self, tag & ~mpack.fixarray)
  }

  var decode_array16 = function(self) {
    var length = self.view.getUint16(self.offset)
    self.offset += 2
    return decode_array_of_length(self, length)
  }

  var decode_array32 = function(self) {
    var length = self.view.getUint32(self.offset)
    self.offset += 4
    return decode_array_of_length(self, length)
  }

  var decode_map_of_length = function(self, length) {
    var map = { }

    for (var i = 0; i != length; ++i) {
      var k = decode_object(self)
      var v = decode_object(self)
      map[k] = v
    }

    return map
  }

  var decode_fixmap = function(self, tag) {
    return decode_map_of_length(self, tag & ~mpack.fixmap)
  }

  var decode_map16 = function(self) {
    var length = self.view.getUint16(self.offset)
    self.offset += 2
    return decode_map_of_length(self, length)
  }

  var decode_map32 = function(self) {
    var length = self.view.getUint32(self.offset)
    self.offset += 4
    return decode_map_of_length(self, length)
  }

  var decode_extended_of_length = function(self, length) {
    var type = self.view.getUint8(self.offset)
    var offset = self.offset + 1
    self.offset = offset + length
    return new mpack.Extended(type, new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length))
  }

  var decode_fixext1 = function(self) {
    return decode_extended_of_length(self, 1)
  }

  var decode_fixext2 = function(self) {
    return decode_extended_of_length(self, 2)
  }

  var decode_fixext4 = function(self) {
    return decode_extended_of_length(self, 4)
  }

  var decode_fixext8 = function(self) {
    return decode_extended_of_length(self, 8)
  }

  var decode_fixext16 = function(self) {
    return decode_extended_of_length(self, 16)
  }

  var decode_ext8 = function(self) {
    var length = self.view.getUint8(self.offset)
    self.offset += 1
    return decode_extended_of_length(self, length)
  }

  var decode_ext16 = function(self) {
    var length = self.view.getUint16(self.offset)
    self.offset += 2
    return decode_extended_of_length(self, length)
  }

  var decode_ext32 = function(self) {
    var length = self.view.getUint32(self.offset)
    self.offset += 4
    return decode_extended_of_length(self, length)
  }

  var decode_object = function(self) {
    var tag = self.view.getUint8(self.offset)
    self.offset += 1

    if ((tag & 0x80) == mpack.fixnum.positive) {
      return decode_positive_fixnum(self, tag)
    }

    if ((tag & 0xE0) == mpack.fixnum.negative) {
      return decode_negative_fixnum(self, tag)
    }

    if ((tag & 0xE0) == mpack.fixstr) {
      return decode_fixstr(self, tag)
    }

    if ((tag & 0xF0) == mpack.fixarray) {
      return decode_fixarray(self, tag)
    }

    if ((tag & 0xF0) == mpack.fixmap) {
      return decode_fixmap(self, tag)
    }

    switch (tag) {
    case mpack.nil:
      return null

    case mpack.false:
      return false

    case mpack.true:
      return true

    case mpack.str8:
      return decode_str8(self)

    case mpack.str16:
      return decode_str16(self)

    case mpack.str32:
      return decode_str32(self)

    case mpack.bin8:
      return decode_bin8(self)

    case mpack.bin16:
      return decode_bin16(self)

    case mpack.bin32:
      return decode_bin32(self)

    case mpack.int8:
      return decode_int8(self)

    case mpack.int16:
      return decode_int16(self)

    case mpack.int32:
      return decode_int32(self)

    case mpack.int64:
      return decode_int64(self)

    case mpack.uint8:
      return decode_uint8(self)

    case mpack.uint16:
      return decode_uint16(self)

    case mpack.uint32:
      return decode_uint32(self)

    case mpack.uint64:
      return decode_uint64(self)

    case mpack.float32:
      return decode_float32(self)

    case mpack.float64:
      return decode_float64(self)

    case mpack.array16:
      return decode_array16(self)

    case mpack.array32:
      return decode_array32(self)

    case mpack.map16:
      return decode_map16(self)

    case mpack.map32:
      return decode_map32(self)

    case mpack.fixext1:
      return decode_fixext1(self)

    case mpack.fixext2:
      return decode_fixext2(self)

    case mpack.fixext4:
      return decode_fixext4(self)

    case mpack.fixext8:
      return decode_fixext8(self)

    case mpack.fixext16:
      return decode_fixext16(self)

    case mpack.ext8:
      return decode_ext8(self)

    case mpack.ext16:
      return decode_ext16(self)

    case mpack.ext32:
      return decode_ext32(self)

    default:
      throw new TypeError("mpack: decoder found an unknown tag: " + tag)
    }
  }

  this.decode = function() {
    var offset = this.offset
    try {
      return decode_object(this)
    }
    catch (e) {
      this.offset = offset

      if (!(e instanceof RangeError)) {
        throw e
      }
    }
  }
}

mpack.decode = function(buffer) {
  return (new mpack.Decoder(buffer)).decode()
}

mpack.Encoder = function(buffer, offset) {
  this.buffer = null
  this.length = 0

  if (buffer !== undefined) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer

      if (offset !== undefined) {
        this.length = offset
      }
    }
    else {
      throw new TypeError("mpack.Encoder: buffer must be undefined or an ArrayBuffer instance")
    }
  }

  var encode_null = function(view, offset) {
    view.setUint8(offset, mpack.nil)
    return 1
  }

  var encode_false = function(view, offset) {
    view.setUint8(offset, mpack.false)
    return 1
  }

  var encode_true = function(view, offset) {
    view.setUint8(offset, mpack.true)
    return 1
  }

  var encode_string = function(view, offset, object) {
    var save_offset = offset
    object = mpack_encode_utf8__(object)

    if (object.length <= 31) {
      view.setUint8(offset, mpack.fixstr | object.length)
      offset += 1
    }
    else if (object.length <= 255) {
      view.setUint8(offset, mpack.str8)
      view.setUint8(offset + 1, object.length)
      offset += 2
    }
    else if (object.length <= 65535) {
      view.setUint8(offset, mpack.str16)
      view.setUint16(offset + 1, object.length)
      offset += 3
    }
    else {
      view.setUint8(offset, mpack.str32)
      view.setUint32(offset + 1, object.length)
      offset += 5
    }

    for (var i = 0, j = offset; i != object.length; ++i, ++j) {
      view.setUint8(j, object.charCodeAt(i))
    }

    return (offset + object.length) - save_offset
  }

  var encode_binary = function(view, offset, object) {
    var save_offset = offset
    
    if (object.byteLength <= 255) {
      view.setUint8(offset, mpack.bin8)
      view.setUint8(offset + 1, object.byteLength)
      offset += 2
    }
    else if (object.byteLength <= 65535) {
      view.setUint8(offset, mpack.bin16)
      view.setUint16(offset + 1, object.byteLength)
      offset += 3
    }
    else {
      view.setUint8(offset, mpack.bin32)
      view.setUint32(offset + 1, object.byteLength)
      offset += 5
    }

    new Uint8Array(view.buffer, view.byteOffset + offset).set(object)
    return (offset + object.byteLength) - save_offset    
  }

  var encode_integer = function(view, offset, object) {
    if (object >= 0) {
      if (object <= 127) {
        view.setUint8(offset, mpack.fixnum.positive | object)
        return 1        
      }

      if (object <= 255) {
        view.setUint8(offset, mpack.uint8)
        view.setUint8(offset + 1, object)
        return 2
      }

      if (object <= 65535) {
        view.setUint8(offset, mpack.uint16)
        view.setUint16(offset + 1, object)
        return 3
      }

      if (object <= 4294967295) {
        view.setUint8(offset, mpack.uint32)
        view.setUint32(offset + 1, object)
        return 5
      }

      // TODO: maybe there's a more clever way to do this.
      throw new TypeError("mpack: javascript doesn't support 64 bits integer")
    }

    else {
      if (object >= -15) {
        view.setUint8(offset, mpack.fixnum.negative | object)
        return 1
      }

      if (object >= -128) {
        view.setUint8(offset, mpack.int8)
        view.setInt8(offset + 1, object)
        return 2
      }

      if (object >= -32768) {
        view.setUint8(offset, mpack.int16)
        view.setInt16(offset + 1, object)
        return 3
      }

      if (object >= -2147483648) {
        view.setUint8(offset, mpack.int32)
        view.setInt32(offset + 1, object)
        return 5
      }

      // TODO: maybe there's a more clever way to handle this.
      throw new TypeError("mpack: javascript doesn't support 64 bits integer")
    }
  }

  var encode_float = function(view, offset, object) {
    view.setUint8(offset, mpack.float64)
    view.setFloat64(offset + 1, object)
    return 9
  }

  var encode_number = function(view, offset, object) {
    if ((object % 1) === 0) {
      return encode_integer(view, offset, object)
    }
    else {
      return encode_float(view, offset, object)
    }
  }

  var encode_array = function(view, offset, object) {
    var save_offset = offset

    if (object.length <= 15) {
      view.setUint8(offset, mpack.fixarray | object.length)
      offset += 1
    }
    else if (object.length <= 65535) {
      view.setUint8(offset, mpack.array16)
      view.setUint16(offset + 1, object.length)
      offset += 3
    }
    else {
      view.setUint8(offset, mpack.array32)
      view.setUint32(offset + 1, object.length)
      offset += 5
    }

    for (i in object) {
      offset += encode_object(view, offset, object[i])
    }

    return offset - save_offset
  }

  var encode_map = function(view, offset, object) {
    var save_offset = offset
    var length = 0

    for (_ in object) {
      length += 1
    }

    if (length <= 15) {
      view.setUint8(offset, mpack.fixmap | length)
      offset += 1
    }
    else if (length <= 65535) {
      view.setUint8(offset, mpack.map16)
      view.setUint16(offset + 1, length)
      offset += 3
    }
    else {
      view.setUint8(offset, mpack.map32)
      view.setUint32(offset + 1, length)
      offset += 5
    }

    for (key in object) {
      offset += encode_object(view, offset, key)
      offset += encode_object(view, offset, object[key])
    }

    return offset - save_offset
  }

  var encode_extended = function(view, offset, object) {
    var save_offset = offset
    var type = object.type
    var data = object.data
    var length = data.byteLength
    
    switch (length) {
    case 1:
      view.setUint8(offset, mpack.fixext1)
      offset += 1
      break;

    case 2:
      view.setUint8(offset, mpack.fixext2)
      offset += 1
      break;

    case 4:
      view.setUint8(offset, mpack.fixext4)
      offset += 1
      break;

    case 8:
      view.setUint8(offset, mpack.fixext8)
      offset += 1
      break;

    case 16:
      view.setUint8(offset, mpack.fixext16)
      offset += 1
      break;

    default:
      if (length <= 255) {
        view.setUint8(offset, mpack.ext8)
        view.setUint8(offset + 1, length)
        offset += 2
      }
      else if (length <= 65535) {
        view.setUint8(offset, mpack.ext16)
        view.setUint16(offset + 1, length)
        offset += 3
      }
      else {
        view.setUint8(offset, mpack.ext32)
        view.setUint32(offset + 1, length)
        offset += 5
      }
    }

    view.setUint8(offset, type)
    offset += 1

    new Uint8Array(view.buffer, view.byteOffset + offset).set(data)
    return (offset + length) - save_offset
  }

  var encode_object = function(view, offset, object) {
    if (object === null) {
      return encode_null(view, offset)
    }

    if (object === true) {
      return encode_true(view, offset)
    }

    if (object === false) {
      return encode_false(view, offset)
    }

    if ((typeof object) == 'string') {
      return encode_string(view, offset, object)
    }

    if ((typeof object) == 'number') {
      return encode_number(view, offset, object)
    }

    if (object instanceof Array) {
      return encode_array(view, offset, object)
    }

    if (object instanceof ArrayBuffer) {
      return encode_binary(view, offset, new Uint8Array(object))
    }

    if (object instanceof Uint8Array) {
      return encode_binary(view, offset, object)
    }

    if (object instanceof Uint16Array) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof Uint32Array) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof Int8Array) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof Int16Array) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof Int32Array) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof DataView) {
      return encode_binary(view, offset, new Uint8Array(object.buffer, object.byteOffset, object.byteLength))
    }

    if (object instanceof mpack.Extended) {
      return encode_extended(view, offset, object)
    }

    if ((typeof object) == 'object') {
      return encode_map(view, offset, object)
    }
      
    throw new TypeError("mpack: no encoding available for objects of type " + typeof(object))
  }

  var encode = function(self, object, encode_callback) {
    var size = 1000

    if (self.buffer === null) {
      self.buffer = new ArrayBuffer(size)
    }
    else {
      size = self.buffer.byteLength
    }

    while (true) {
      try {
        self.length += encode_callback(new DataView(self.buffer), self.length, object)
        break
      }
      catch (e) {
        if (!(e instanceof RangeError)) {
          throw e
        }

        size *= 10
        self.buffer = mpack_memcpy__(new ArrayBuffer(size), self.buffer)
      }
    }

    return self
  }

  this.encode = function(object) {
    return encode(this, object, encode_object)
  }

  this.encode_nil = function() {
    return encode(this, null, encode_null)
  }

  this.encode_boolean = function(object) {
    return encode(this, null, object ? encode_true : encode_false)
  }

  this.encode_number = function(object) {
    return encode(this, object, encode_number)
  }

  this.encode_string = function(object) {
    return encode(this, object, encode_string)
  }

  this.encode_binary = function(object) {
    return encode(this, object, encode_binary)
  }

  this.encode_array = function(object) {
    return encode(this, object, encode_array)
  }

  this.encode_map = function(object) {
    return encode(this, object, encode_map)
  }

  this.encode_extended = function(object) {
    return encode(this, object, encode_extended)
  }

  this.bytes = function() {
    return new DataView(this.buffer, 0, this.length)
  }

  this.flush = function() {
    var buffer = this.buffer
    var length = this.length
    this.buffer = null
    this.length = 0
    return new DataView(buffer, 0, length)
  }
}

mpack.encode = function(object) {
  return (new mpack.Encoder()).encode(object).flush()
}

mpack.Extended = function(type, data) {
  if ((type < -256) || (type > 255)) {
    throw RangeError("mpack: invalid extended type [" + type + "]")
  }
  this.type = type
  this.data = data
}


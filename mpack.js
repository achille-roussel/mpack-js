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
  else { // expects a TypedArray
    this.buffer = buffer.buffer
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
    return decode_string_of_length(self, decode_uint8(self))
  }

  var decode_str16 = function(self) {
    return decode_string_of_length(self, decode_uint16(self))
  }

  var decode_str32 = function(self) {
    return decode_string_of_length(self, decode_uint32(self))
  }

  var decode_bin8 = function(self) {
    var length = decode_uint8(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_bin16 = function(self) {
    var length = decode_uint16(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_bin32 = function(self) {
    var length = decode_uint32(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  var decode_positive_fixnum = function(self, tag) {
    return tag
  }

  var decode_negative_fixnum = function(self, tag) {
    return self.view.getInt8(self.offset - 1)
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
    return decode_array_of_length(self, decode_uint16(self))
  }

  var decode_array32 = function(self) {
    return decode_array_of_length(self, decode_uint32(self))
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
    return decode_map_of_length(self, decode_uint16(self))
  }

  var decode_map32 = function(self) {
    return decode_map_of_length(self, decode_uint32(self))
  }

  var decode_extended_of_length = function(self, length) {
    var type = decode_uint8(self)
    var offset = self.offset
    self.offset += length
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
    return decode_extended_of_length(self, decode_uint8(self))
  }

  var decode_ext16 = function(self) {
    return decode_extended_of_length(self, decode_uint16(self))
  }

  var decode_ext32 = function(self) {
    return decode_extended_of_length(self, decode_uint32(self))
  }

  var decode_object = function(self) {
    var tag = decode_uint8(self)

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
  this.view = null
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

  var write_value = function(self, value, size, callback) {
    var view = self.view
    var offset = self.length

    if ((offset + size) <= view.byteLength) {
      callback(offset, value)
    }

    self.length += size
  }

  var write_string = function(self, string, string_offset, string_length) {
    var view = self.view
    var offset = self.length

    if ((offset + string_length) <= view.byteLength) {
      for (var i = 0, j = offset; i != string_length; ++i, ++j) {
        view.setUint8(j, string.charCodeAt(i + string_offset))
      }
    }

    self.length += string_length
  }

  var write_bytes = function(self, bytes, bytes_offset, bytes_length) {
    var view = self.view
    var offset = self.length

    if ((offset + bytes_length) <= view.byteLength) {
      new Uint8Array(view.buffer, view.byteOffset + offset).set(bytes)
    }
    
    self.length += bytes_length
  }

  var write_uint8 = function(self, value) {
    write_value(self, value, 1, function(offset, value) { self.view.setUint8(offset, value) })
  }

  var write_uint16 = function(self, value) {
    write_value(self, value, 2, function(offset, value) { self.view.setUint16(offset, value) })
  }

  var write_uint32 = function(self, value) {
    write_value(self, value, 4, function(offset, value) { self.view.setUint32(offset, value) })
  }

  var write_int8 = function(self, value) {
    write_value(self, value, 1, function(offset, value) { self.view.setInt8(offset, value) })
  }

  var write_int16 = function(self, value) {
    write_value(self, value, 2, function(offset, value) { self.view.setInt16(offset, value) } )
  }

  var write_int32 = function(self, value) {
    write_value(self, value, 4, function(offset, value) { self.view.setInt32(offset, value) })
  }

  var write_float64 = function(self, value) {
    write_value(self, value, 8, function(offset, value) { self.view.setFloat64(offset, value) })
  }

  var encode_nil = function(self) {
    write_uint8(self, mpack.nil)
  }

  var encode_false = function(self) {
    write_uint8(self, mpack.false)
  }

  var encode_true = function(self) {
    write_uint8(self, mpack.true)
  }

  var encode_string = function(self, object) {
    object = mpack_encode_utf8__(object)
    var length = object.length

    if (length <= 31) {
      write_uint8(self, mpack.fixstr | length)
    }
    else if (length <= 255) {
      write_uint8(self, mpack.str8)
      write_uint8(self, length)
    }
    else if (length <= 65535) {
      write_uint8(self, mpack.str16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, mpack.str32)
      write_uint32(self, length)
    }

    write_string(self, object, 0, length)
  }

  var encode_binary = function(self, object) {
    var length = object.byteLength
    
    if (length <= 255) {
      write_uint8(self, mpack.bin8)
      write_uint8(self, length)
    }
    else if (length <= 65535) {
      write_uint8(self, mpack.bin16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, mpack.bin32)
      write_uint32(self, length)
    }

    write_bytes(self, object, 0, length)
  }

  var encode_integer = function(self, object) {
    if (object >= 0) {
      if (object <= 127) {
        write_uint8(self, mpack.fixnum.positive | object)
      }
      else if (object <= 255) {
        write_uint8(self, mpack.uint8)
        write_uint8(self, object)
      }
      else if (object <= 65535) {
        write_uint8(self, mpack.uint16)
        write_uint16(self, object)
      }
      else if (object <= 4294967295) {
        write_uint8(self, mpack.uint32)
        write_uint32(self, object)
      }
      else {
        // TODO: maybe there's a more clever way to do this.
        throw new TypeError("mpack: javascript doesn't support 64 bits integer")
      }
    }

    else {
      if (object >= -15) {
        write_uint8(self, mpack.fixnum.negative | object)
      }
      else if (object >= -128) {
        write_uint8(self, mpack.int8)
        write_int8(self, object)
      }
      else if (object >= -32768) {
        write_uint8(self, mpack.int16)
        write_int16(self, object)
      }
      else if (object >= -2147483648) {
        write_uint8(self, mpack.int32)
        write_int32(self, object)
      }
      else {
        // TODO: maybe there's a more clever way to handle this.
        throw new TypeError("mpack: javascript doesn't support 64 bits integer")
      }
    }
  }

  var encode_float = function(self, object) {
    write_uint8(self, mpack.float64)
    write_float64(self, object)
  }

  var encode_number = function(self, object) {
    if ((object % 1) === 0) {
      return encode_integer(self, object)
    }
    else {
      return encode_float(self, object)
    }
  }

  var encode_array = function(self, object) {
    var length = object.length
    
    if (length <= 15) {
      write_uint8(self, mpack.fixarray | length)
    }
    else if (length <= 65535) {
      write_uint8(self, mpack.array16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, mpack.array32)
      write_uint32(self, length)
    }

    for (i in object) {
      encode_object(self, object[i])
    }
  }

  var encode_map = function(self, object) {
    var length = 0

    for (_ in object) {
      length += 1
    }

    if (length <= 15) {
      write_uint8(self, mpack.fixmap | length)
    }
    else if (length <= 65535) {
      write_uint8(self, mpack.map16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, mpack.map32)
      write_uint32(self, length)
    }

    for (key in object) {
      encode_object(self, key)
      encode_object(self, object[key])
    }
  }

  var encode_extended = function(self, object) {
    var type = object.type
    var data = object.data
    var length = data.byteLength
    
    switch (length) {
    case 1:
      write_uint8(self, mpack.fixext1)
      break;

    case 2:
      write_uint8(self, mpack.fixext2)
      break;

    case 4:
      write_uint8(self, mpack.fixext4)
      break;

    case 8:
      write_uint8(self, mpack.fixext8)
      break;

    case 16:
      write_uint8(self, mpack.fixext16)
      break;

    default:
      if (length <= 255) {
        write_uint8(self, mpack.ext8)
        write_uint8(self, length)
      }
      else if (length <= 65535) {
        write_uint8(self, mpack.ext16)
        write_uint16(self, length)
      }
      else {
        write_uint8(self, mpack.ext32)
        write_uint32(self, length)
      }
    }

    write_uint8(self, type)
    write_bytes(self, data, 0, length)
  }

  var encode_object = function(self, object) {
    if (object === null) {
      return encode_nil(self)
    }

    if (object === true) {
      return encode_true(self)
    }

    if (object === false) {
      return encode_false(self)
    }

    if ((typeof object) == 'string') {
      return encode_string(self, object)
    }

    if ((typeof object) == 'number') {
      return encode_number(self, object)
    }

    if (object instanceof Array) {
      return encode_array(self, object)
    }

    if (object instanceof ArrayBuffer) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof Uint8Array) {
      return encode_binary(self, object)
    }

    if (object instanceof Uint16Array) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof Uint32Array) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof Int8Array) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof Int16Array) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof Int32Array) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof DataView) {
      return encode_binary(self, new Uint8Array(object))
    }

    if (object instanceof mpack.Extended) {
      return encode_extended(self, object)
    }

    if ((typeof object) == 'object') {
      return encode_map(self, object)
    }
      
    throw new TypeError("mpack: no encoding available for objects of type " + typeof(object))
  }

  var encode = function(self, object, encode_callback) {
    var old_length = self.length

    if (self.buffer === null) {
      self.buffer = new ArrayBuffer(1000)
      self.view   = new DataView(self.buffer)
    }
    
    encode_callback(self, object)
    var new_length = self.length

    if (new_length > self.view.byteLength) {
      new_length  = (Math.ceil(new_length / 1000) + ((new_length % 1000) == 0 ? 0 : 1)) * 1000
      self.buffer = mpack_memcpy__(new ArrayBuffer(new_length), self.buffer)
      self.view   = new DataView(self.buffer)
      self.length = old_length
      encode_callback(self, object)
    }

    return self
  }

  this.encode = function(object) {
    return encode(this, object, encode_object)
  }

  this.encode_nil = function() {
    return encode(this, null, encode_nil)
  }

  this.encode_boolean = function(object) {
    return encode(this, null, object ? encode_true : encode_false)
  }

  this.encode_number = function(object) {
    return encode(this, object, encode_number)
  }

  this.encode_integer = function(object) {
    return encode(this, object, encode_integer)
  }

  this.encode_float = function(object) {
    return encode(this, object, encode_float)
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
    return (this.buffer === null) ? new Uint8Array() : new Uint8Array(this.buffer, 0, this.length)
  }

  this.flush = function() {
    var bytes = this.bytes()
    this.buffer = null
    this.length = 0
    return bytes
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


/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Achille Roussel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var mpack = (function(mpack, undefined) {
  'use strict'

  function encode_utf8(s) {
    return unescape(encodeURIComponent(s))
  }

  function decode_utf8(s) {
    return decodeURIComponent(escape(s))
  }

  function memcpy(dst, src) {
    new Uint8Array(dst).set(new Uint8Array(src))
    return dst
  }

  var NIL      = 0xc0
  var FALSE    = 0xc2
  var TRUE     = 0xc3
  var BIN8     = 0xc4
  var BIN16    = 0xc5
  var BIN32    = 0xc6
  var EXT8     = 0xc7
  var EXT16    = 0xc8
  var EXT32    = 0xc9
  var FLOAT32  = 0xca
  var FLOAT64  = 0xcb
  var UINT8    = 0xcc
  var UINT16   = 0xcd
  var UINT32   = 0xce
  var UINT64   = 0xcf
  var INT8     = 0xd0
  var INT16    = 0xd1
  var INT32    = 0xd2
  var INT64    = 0xd3
  var FIXEXT1  = 0xd4
  var FIXEXT2  = 0xd5
  var FIXEXT4  = 0xd6
  var FIXEXT8  = 0xd7
  var FIXEXT16 = 0xd8
  var STR8     = 0xd9
  var STR16    = 0xda
  var STR32    = 0xdb
  var ARRAY16  = 0xdc
  var ARRAY32  = 0xdd
  var MAP16    = 0xde
  var MAP32    = 0xdf
  var FIXARRAY = 0x90
  var FIXSTR   = 0xa0
  var FIXMAP   = 0x80
  var POSITIVE_FIXNUM = 0x00
  var NEGATIVE_FIXNUM = 0xe0

  mpack.encode = function (object) {
    return (new mpack.Encoder()).encode(object).flush()
  }

  mpack.decode = function (buffer) {
    return (new mpack.Decoder(buffer)).decode()
  }

  mpack.Decoder = function (buffer) {
    if (buffer instanceof ArrayBuffer) {
      this.buffer = buffer
      this.offset = 0
      this.view   = new DataView(this.buffer)
    }
    else { // expects a TypedArray
      this.buffer = buffer.buffer
      this.offset = 0
      this.view   = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    }
  }

  function decode_string_of_length(self, length) {
    var off = self.offset
    self.offset += length

    var buf = new Uint8Array(self.view.buffer, self.view.byteOffset + off, length)
    var str = ''

    for (var i = 0, n = buf.byteLength; i !== n; ++i) {
      str += String.fromCharCode(buf[i])
    }

    return decode_utf8(str)
  }

  function decode_fixstr(self, tag) {
    return decode_string_of_length(self, tag & ~FIXSTR)
  }

  function decode_str8(self) {
    return decode_string_of_length(self, decode_uint8(self))
  }

  function decode_str16(self) {
    return decode_string_of_length(self, decode_uint16(self))
  }

  function decode_str32(self) {
    return decode_string_of_length(self, decode_uint32(self))
  }

  function decode_bin8(self) {
    var length = decode_uint8(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  function decode_bin16(self) {
    var length = decode_uint16(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  function decode_bin32(self) {
    var length = decode_uint32(self)
    var offset = self.offset
    self.offset += length
    return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
  }

  function decode_positive_fixnum(self, tag) {
    return tag
  }

  function decode_negative_fixnum(self, tag) {
    return self.view.getInt8(self.offset - 1)
  }

  function decode_uint8(self) {
    var value = self.view.getUint8(self.offset)
    self.offset += 1
    return value
  }

  function decode_uint16(self) {
    var value = self.view.getUint16(self.offset)
    self.offset += 2
    return value
  }

  function decode_uint32(self) {
    var value = self.view.getUint32(self.offset)
    self.offset += 4
    return value
  }

  function decode_uint64(self) {
    // TODO: maybe there's a more clever way to do this.
    throw new TypeError("mpack: javascript doesn't support 64 bits integer")
  }

  function decode_int8(self) {
    var value = self.view.getInt8(self.offset)
    self.offset += 1
    return value
  }

  function decode_int16(self) {
    var value = self.view.getInt16(self.offset)
    self.offset += 2
    return value
  }

  function decode_int32(self) {
    var value = self.view.getInt32(self.offset)
    self.offset += 4
    return value
  }

  function decode_int64(self) {
    // TODO: maybe there's a more clever way to do this.
    throw new TypeError("mpack: javascript doesn't support 64 bits integer")
  }

  function decode_float32(self) {
    var value = self.view.getFloat32(self.offset)
    self.offset += 4
    return value
  }

  function decode_float64(self) {
    var value = self.view.getFloat64(self.offset)
    self.offset += 8
    return value
  }

  function decode_array_of_length(self, length) {
    var array = new Array(length)

    for (var i = 0; i !== length; ++i) {
      array[i] = decode_object(self)
    }

    return array
  }

  function decode_fixarray(self, tag) {
    return decode_array_of_length(self, tag & ~FIXARRAY)
  }

  function decode_array16(self) {
    return decode_array_of_length(self, decode_uint16(self))
  }

  function decode_array32(self) {
    return decode_array_of_length(self, decode_uint32(self))
  }

  function decode_map_of_length(self, length) {
    var map = { }

    for (var i = 0; i !== length; ++i) {
      var k = decode_object(self)
      var v = decode_object(self)
      map[k] = v
    }

    return map
  }

  function decode_fixmap(self, tag) {
    return decode_map_of_length(self, tag & ~FIXMAP)
  }

  function decode_map16(self) {
    return decode_map_of_length(self, decode_uint16(self))
  }

  function decode_map32(self) {
    return decode_map_of_length(self, decode_uint32(self))
  }

  function decode_extended_of_length(self, length) {
    var type = decode_uint8(self)
    var offset = self.offset
    self.offset += length
    return new mpack.Extended(type, new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length))
  }

  function decode_fixext1(self) {
    return decode_extended_of_length(self, 1)
  }

  function decode_fixext2(self) {
    return decode_extended_of_length(self, 2)
  }

  function decode_fixext4(self) {
    return decode_extended_of_length(self, 4)
  }

  function decode_fixext8(self) {
    return decode_extended_of_length(self, 8)
  }

  function decode_fixext16(self) {
    return decode_extended_of_length(self, 16)
  }

  function decode_ext8(self) {
    return decode_extended_of_length(self, decode_uint8(self))
  }

  function decode_ext16(self) {
    return decode_extended_of_length(self, decode_uint16(self))
  }

  function decode_ext32(self) {
    return decode_extended_of_length(self, decode_uint32(self))
  }

  function decode_object(self) {
    var tag = decode_uint8(self)

    if ((tag & 0x80) === POSITIVE_FIXNUM) {
      return decode_positive_fixnum(self, tag)
    }

    if ((tag & 0xE0) === NEGATIVE_FIXNUM) {
      return decode_negative_fixnum(self, tag)
    }

    if ((tag & 0xE0) === FIXSTR) {
      return decode_fixstr(self, tag)
    }

    if ((tag & 0xF0) === FIXARRAY) {
      return decode_fixarray(self, tag)
    }

    if ((tag & 0xF0) === FIXMAP) {
      return decode_fixmap(self, tag)
    }

    switch (tag) {
    case NIL:
      return null

    case FALSE:
      return false

    case TRUE:
      return true

    case STR8:
      return decode_str8(self)

    case STR16:
      return decode_str16(self)

    case STR32:
      return decode_str32(self)

    case BIN8:
      return decode_bin8(self)

    case BIN16:
      return decode_bin16(self)

    case BIN32:
      return decode_bin32(self)

    case INT8:
      return decode_int8(self)

    case INT16:
      return decode_int16(self)

    case INT32:
      return decode_int32(self)

    case INT64:
      return decode_int64(self)

    case UINT8:
      return decode_uint8(self)

    case UINT16:
      return decode_uint16(self)

    case UINT32:
      return decode_uint32(self)

    case UINT64:
      return decode_uint64(self)

    case FLOAT32:
      return decode_float32(self)

    case FLOAT64:
      return decode_float64(self)

    case ARRAY16:
      return decode_array16(self)

    case ARRAY32:
      return decode_array32(self)

    case MAP16:
      return decode_map16(self)

    case MAP32:
      return decode_map32(self)

    case FIXEXT1:
      return decode_fixext1(self)

    case FIXEXT2:
      return decode_fixext2(self)

    case FIXEXT4:
      return decode_fixext4(self)

    case FIXEXT8:
      return decode_fixext8(self)

    case FIXEXT16:
      return decode_fixext16(self)

    case EXT8:
      return decode_ext8(self)

    case EXT16:
      return decode_ext16(self)

    case EXT32:
      return decode_ext32(self)

    default:
      throw new TypeError("mpack: decoder found an unknown tag: " + tag)
    }
  }

  mpack.Decoder.prototype.decode = function () {
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

  mpack.Encoder = function (buffer, offset) {
    this.view   = null
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
  }

  function write_uint8(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 1) <= view.byteLength) {
      view.setUint8(offset, value)
    }
    
    self.length += 1
  }

  function write_uint16(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 2) <= view.byteLength) {
      view.setUint16(offset, value)
    }
    
    self.length += 2
  }

  function write_uint32(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 4) <= view.byteLength) {
      view.setUint32(offset, value)
    }
    
    self.length += 4
  }

  function write_uint64(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 8) <= view.byteLength) {
      view.setUint64(offset, value)
    }
    
    self.length += 8
  }

  function write_int8(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 1) <= view.byteLength) {
      view.setInt8(offset, value)
    }
    
    self.length += 1
  }

  function write_int16(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 2) <= view.byteLength) {
      view.setInt16(offset, value)
    }
    
    self.length += 2
  }

  function write_int32(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 4) <= view.byteLength) {
      view.setInt32(offset, value)
    }
    
    self.length += 4
  }

  function write_int64(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 8) <= view.byteLength) {
      view.setInt64(offset, value)
    }
    
    self.length += 8
  }

  function write_float64(self, value) {
    var view = self.view
    var offset = self.length
    
    if ((offset + 8) <= view.byteLength) {
      view.setFloat64(offset, value)
    }
    
    self.length += 8
  }

  function write_string(self, string, string_offset, string_length) {
    var view = self.view
    var offset = self.length

    if ((offset + string_length) <= view.byteLength) {
      for (var i = 0, j = offset; i !== string_length; ++i, ++j) {
        view.setUint8(j, string.charCodeAt(i + string_offset))
      }
    }

    self.length += string_length
  }

  function write_bytes(self, bytes, bytes_offset, bytes_length) {
    var view = self.view
    var offset = self.length

    if ((offset + bytes_length) <= view.byteLength) {
      new Uint8Array(view.buffer, view.byteOffset + offset).set(bytes)
    }
    
    self.length += bytes_length
  }

  function encode_nil(self) {
    write_uint8(self, NIL)
  }

  function encode_false(self) {
    write_uint8(self, FALSE)
  }

  function encode_true(self) {
    write_uint8(self, TRUE)
  }

  function encode_string(self, object) {
    object = encode_utf8(object)
    var length = object.length

    if (length <= 31) {
      write_uint8(self, FIXSTR | length)
    }
    else if (length <= 255) {
      write_uint8(self, STR8)
      write_uint8(self, length)
    }
    else if (length <= 65535) {
      write_uint8(self, STR16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, STR32)
      write_uint32(self, length)
    }

    write_string(self, object, 0, length)
  }

  function encode_binary(self, object) {
    var length = object.byteLength
    
    if (length <= 255) {
      write_uint8(self, BIN8)
      write_uint8(self, length)
    }
    else if (length <= 65535) {
      write_uint8(self, BIN16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, BIN32)
      write_uint32(self, length)
    }

    write_bytes(self, object, 0, length)
  }

  function encode_integer(self, object) {
    if (object >= 0) {
      if (object <= 127) {
        write_uint8(self, POSITIVE_FIXNUM | object)
      }
      else if (object <= 255) {
        write_uint8(self, UINT8)
        write_uint8(self, object)
      }
      else if (object <= 65535) {
        write_uint8(self, UINT16)
        write_uint16(self, object)
      }
      else if (object <= 4294967295) {
        write_uint8(self, UINT32)
        write_uint32(self, object)
      }
      else {
        // TODO: maybe there's a more clever way to do this.
        throw new TypeError("mpack: javascript doesn't support 64 bits integer")
      }
    }

    else {
      if (object >= -15) {
        write_uint8(self, NEGATIVE_FIXNUM | object)
      }
      else if (object >= -128) {
        write_uint8(self, INT8)
        write_int8(self, object)
      }
      else if (object >= -32768) {
        write_uint8(self, INT16)
        write_int16(self, object)
      }
      else if (object >= -2147483648) {
        write_uint8(self, INT32)
        write_int32(self, object)
      }
      else {
        // TODO: maybe there's a more clever way to handle this.
        throw new TypeError("mpack: javascript doesn't support 64 bits integer")
      }
    }
  }

  function encode_float(self, object) {
    write_uint8(self, FLOAT64)
    write_float64(self, object)
  }

  function encode_number(self, object) {
    if ((object % 1) === 0) {
      encode_integer(self, object)
    }
    else {
      encode_float(self, object)
    }
  }

  function encode_array(self, object) {
    var length = object.length
    var i = undefined
    
    if (length <= 15) {
      write_uint8(self, FIXARRAY | length)
    }
    else if (length <= 65535) {
      write_uint8(self, ARRAY16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, ARRAY32)
      write_uint32(self, length)
    }

    for (i in object) {
      encode_object(self, object[i])
    }
  }

  function encode_map(self, object) {
    var length = 0
    var key = undefined
    var _ = undefined

    for (_ in object) {
      length += 1
    }

    if (length <= 15) {
      write_uint8(self, FIXMAP | length)
    }
    else if (length <= 65535) {
      write_uint8(self, MAP16)
      write_uint16(self, length)
    }
    else {
      write_uint8(self, MAP32)
      write_uint32(self, length)
    }

    for (key in object) {
      encode_object(self, key)
      encode_object(self, object[key])
    }
  }

  function encode_extended(self, object) {
    var type = object.type
    var data = object.data
    var length = data.byteLength
    
    switch (length) {
    case 1:
      write_uint8(self, FIXEXT1)
      break

    case 2:
      write_uint8(self, FIXEXT2)
      break

    case 4:
      write_uint8(self, FIXEXT4)
      break

    case 8:
      write_uint8(self, FIXEXT8)
      break

    case 16:
      write_uint8(self, FIXEXT16)
      break

    default:
      if (length <= 255) {
        write_uint8(self, EXT8)
        write_uint8(self, length)
      }
      else if (length <= 65535) {
        write_uint8(self, EXT16)
        write_uint16(self, length)
      }
      else {
        write_uint8(self, EXT32)
        write_uint32(self, length)
      }
    }

    write_uint8(self, type)
    write_bytes(self, data, 0, length)
  }

  function encode_object(self, object) {
    if (object === null) {
      return encode_nil(self)
    }

    if (object === true) {
      return encode_true(self)
    }

    if (object === false) {
      return encode_false(self)
    }

    if ((typeof object) === 'string') {
      return encode_string(self, object)
    }

    if ((typeof object) === 'number') {
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

    if ((typeof object) === 'object') {
      return encode_map(self, object)
    }
      
    throw new TypeError("mpack: no encoding available for objects of type " + typeof(object))
  }

  function encode(self, object, encode_callback) {
    var old_length = self.length

    if (self.buffer === null) {
      self.buffer = new ArrayBuffer(1000)
      self.view   = new DataView(self.buffer)
    }
    
    encode_callback(self, object)
    var new_length = self.length

    if (new_length > self.view.byteLength) {
      new_length  = (Math.ceil(new_length / 1000) + ((new_length % 1000) === 0 ? 0 : 1)) * 1000
      self.buffer = memcpy(new ArrayBuffer(new_length), self.buffer)
      self.view   = new DataView(self.buffer)
      self.length = old_length
      encode_callback(self, object)
    }

    return self
  }

  mpack.Encoder.prototype.encode = function (object) {
    return encode(this, object, encode_object)
  }

  mpack.Encoder.prototype.encode_nil = function () {
    return encode(this, null, encode_nil)
  }

  mpack.Encoder.prototype.encode_boolean = function (object) {
    return encode(this, null, object ? encode_true : encode_false)
  }

  mpack.Encoder.prototype.encode_number = function (object) {
    return encode(this, object, encode_number)
  }

  mpack.Encoder.prototype.encode_integer = function (object) {
    return encode(this, object, encode_integer)
  }

  mpack.Encoder.prototype.encode_float = function (object) {
    return encode(this, object, encode_float)
  }

  mpack.Encoder.prototype.encode_string = function (object) {
    return encode(this, object, encode_string)
  }

  mpack.Encoder.prototype.encode_binary = function (object) {
    return encode(this, object, encode_binary)
  }

  mpack.Encoder.prototype.encode_array = function (object) {
    return encode(this, object, encode_array)
  }

  mpack.Encoder.prototype.encode_map = function (object) {
    return encode(this, object, encode_map)
  }

  mpack.Encoder.prototype.encode_extended = function (object) {
    return encode(this, object, encode_extended)
  }

  mpack.Encoder.prototype.bytes = function () {
    return (this.buffer === null) ? new Uint8Array() : new Uint8Array(this.buffer, 0, this.length)
  }

  mpack.Encoder.prototype.flush = function () {
    var bytes = this.bytes()
    this.buffer = null
    this.length = 0
    return bytes
  }
  
  mpack.Extended = function (type, data) {
    if ((type < -256) || (type > 255)) {
      throw RangeError("mpack: invalid extended type [" + type + "]")
    }
    this.type = type
    this.data = data
  }

  return mpack
})({ })

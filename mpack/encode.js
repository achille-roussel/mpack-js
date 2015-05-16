/*
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
'use strict'

var Extended = require('./extended.js').Extended

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

function memcpy(dst, src) {
  new Uint8Array(dst).set(new Uint8Array(src))
  return dst
}

function encodeUTF8(s) {
  return unescape(encodeURIComponent(s))
}

function Encoder(buffer, offset) {
  this.view   = undefined
  this.buffer = undefined
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

function writeUint8(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 1) <= view.byteLength) {
    view.setUint8(offset, value)
  }

  self.length += 1
}

function writeUint16(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 2) <= view.byteLength) {
    view.setUint16(offset, value)
  }

  self.length += 2
}

function writeUint32(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 4) <= view.byteLength) {
    view.setUint32(offset, value)
  }

  self.length += 4
}

function writeInt8(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 1) <= view.byteLength) {
    view.setInt8(offset, value)
  }

  self.length += 1
}

function writeInt16(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 2) <= view.byteLength) {
    view.setInt16(offset, value)
  }

  self.length += 2
}

function writeInt32(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 4) <= view.byteLength) {
    view.setInt32(offset, value)
  }

  self.length += 4
}

function writeFloat64(self, value) {
  var view   = self.view
  var offset = self.length

  if ((offset + 8) <= view.byteLength) {
    view.setFloat64(offset, value)
  }

  self.length += 8
}

function writeString(self, string, stringOffset, stringLength) {
  var view   = self.view
  var offset = self.length
  var i      = undefined
  var j      = undefined

  if ((offset + stringLength) <= view.byteLength) {
    for (i = 0, j = offset; i !== stringLength; ++i, ++j) {
      view.setUint8(j, string.charCodeAt(i + stringOffset))
    }
  }

  self.length += stringLength
}

function writeBytes(self, bytes, bytesOffset, bytesLength) {
  var view   = self.view
  var offset = self.length

  if ((offset + bytesLength) <= view.byteLength) {
    new Uint8Array(view.buffer, view.byteOffset + offset).set(bytes)
  }

  self.length += bytesLength
}

function encodeNil(self) {
  writeUint8(self, NIL)
}

function encodeFalse(self) {
  writeUint8(self, FALSE)
}

function encodeTrue(self) {
  writeUint8(self, TRUE)
}

function encodeString(self, object) {
  var length = undefined

  object = encodeUTF8(object)
  length = object.length

  if (length <= 31) {
    writeUint8(self, FIXSTR | length)
  }
  else if (length <= 255) {
    writeUint8(self, STR8)
    writeUint8(self, length)
  }
  else if (length <= 65535) {
    writeUint8(self, STR16)
    writeUint16(self, length)
  }
  else {
    writeUint8(self, STR32)
    writeUint32(self, length)
  }

  writeString(self, object, 0, length)
}

function encodeBinary(self, object) {
  var length = object.byteLength

  if (length <= 255) {
    writeUint8(self, BIN8)
    writeUint8(self, length)
  }
  else if (length <= 65535) {
    writeUint8(self, BIN16)
    writeUint16(self, length)
  }
  else {
    writeUint8(self, BIN32)
    writeUint32(self, length)
  }

  writeBytes(self, object, 0, length)
}

function encodeInteger(self, object) {
  if (object >= 0) {
    if (object <= 127) {
      writeUint8(self, POSITIVE_FIXNUM | object)
    }
    else if (object <= 255) {
      writeUint8(self, UINT8)
      writeUint8(self, object)
    }
    else if (object <= 65535) {
      writeUint8(self, UINT16)
      writeUint16(self, object)
    }
    else if (object <= 4294967295) {
      writeUint8(self, UINT32)
      writeUint32(self, object)
    }
    else {
      // TODO: maybe there's a more clever way to do this.
      throw new TypeError("mpack: javascript doesn't support 64 bits integer")
    }
  }

  else {
    if (object >= -15) {
      writeUint8(self, NEGATIVE_FIXNUM | object)
    }
    else if (object >= -128) {
      writeUint8(self, INT8)
      writeInt8(self, object)
    }
    else if (object >= -32768) {
      writeUint8(self, INT16)
      writeInt16(self, object)
    }
    else if (object >= -2147483648) {
      writeUint8(self, INT32)
      writeInt32(self, object)
    }
    else {
      // TODO: maybe there's a more clever way to handle this.
      throw new TypeError("mpack: javascript doesn't support 64 bits integer")
    }
  }
}

function encodeFloat(self, object) {
  writeUint8(self, FLOAT64)
  writeFloat64(self, object)
}

function encodeNumber(self, object) {
  if ((object % 1) === 0) {
    encodeInteger(self, object)
  }
  else {
    encodeFloat(self, object)
  }
}

function encodeArray(self, object) {
  var length = object.length
  var index  = undefined

  if (length <= 15) {
    writeUint8(self, FIXARRAY | length)
  }
  else if (length <= 65535) {
    writeUint8(self, ARRAY16)
    writeUint16(self, length)
  }
  else {
    writeUint8(self, ARRAY32)
    writeUint32(self, length)
  }

  for (index in object) {
    encodeObject(self, object[index])
  }
}

function encodeMap(self, object) {
  var length = 0
  var key    = undefined

  for (key in object) {
    length += 1
  }

  if (length <= 15) {
    writeUint8(self, FIXMAP | length)
  }
  else if (length <= 65535) {
    writeUint8(self, MAP16)
    writeUint16(self, length)
  }
  else {
    writeUint8(self, MAP32)
    writeUint32(self, length)
  }

  for (key in object) {
    encodeObject(self, key)
    encodeObject(self, object[key])
  }
}

function encodeExtended(self, object) {
  var type   = object.type
  var data   = object.data
  var length = data.byteLength

  switch (length) {
  case 1:
    writeUint8(self, FIXEXT1)
    break

  case 2:
    writeUint8(self, FIXEXT2)
    break

  case 4:
    writeUint8(self, FIXEXT4)
    break

  case 8:
    writeUint8(self, FIXEXT8)
    break

  case 16:
    writeUint8(self, FIXEXT16)
    break

  default:
    if (length <= 255) {
      writeUint8(self, EXT8)
      writeUint8(self, length)
    }
    else if (length <= 65535) {
      writeUint8(self, EXT16)
      writeUint16(self, length)
    }
    else {
      writeUint8(self, EXT32)
      writeUint32(self, length)
    }
  }

  writeUint8(self, type)
  writeBytes(self, data, 0, length)
}

function encodeObject(self, object) {
  if (object === null) {
    return encodeNil(self)
  }

  if (object === true) {
    return encodeTrue(self)
  }

  if (object === false) {
    return encodeFalse(self)
  }

  if ((typeof object) === 'string') {
    return encodeString(self, object)
  }

  if ((typeof object) === 'number') {
    return encodeNumber(self, object)
  }

  if (object instanceof Array) {
    return encodeArray(self, object)
  }

  if (object instanceof ArrayBuffer) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Uint8Array) {
    return encodeBinary(self, object)
  }

  if (object instanceof Uint16Array) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Uint32Array) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Int8Array) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Int16Array) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Int32Array) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof DataView) {
    return encodeBinary(self, new Uint8Array(object))
  }

  if (object instanceof Extended) {
    return encodeExtended(self, object)
  }

  if ((typeof object) === 'object') {
    return encodeMap(self, object)
  }

  throw new TypeError("mpack: no encoding available for objects of type " + typeof(object))
}

function encodeValue(self, object, callback) {
  var oldLength = self.length
  var newLength = undefined

  if (self.buffer === undefined) {
    self.buffer = new ArrayBuffer(1000)
    self.view   = new DataView(self.buffer)
  }

  callback(self, object)
  newLength = self.length

  if (newLength > self.view.byteLength) {
    newLength  = (Math.ceil(newLength / 1000) + ((newLength % 1000) === 0 ? 0 : 1)) * 1000
    self.buffer = memcpy(new ArrayBuffer(newLength), self.buffer)
    self.view   = new DataView(self.buffer)
    self.length = oldLength
    callback(self, object)
  }

  return self
}

Encoder.prototype.encode = function (object) {
  return encodeValue(this, object, encodeObject)
}

Encoder.prototype.encodeNil = function () {
  return encodeValue(this, null, encodeNil)
}

Encoder.prototype.encodeBoolean = function (object) {
  return encodeValue(this, null, object ? encodeTrue : encodeFalse)
}

Encoder.prototype.encodeNumber = function (object) {
  return encodeValue(this, object, encodeNumber)
}

Encoder.prototype.encodeInteger = function (object) {
  return encodeValue(this, object, encodeInteger)
}

Encoder.prototype.encodeFloat = function (object) {
  return encodeValue(this, object, encodeFloat)
}

Encoder.prototype.encodeString = function (object) {
  return encodeValue(this, object, encodeString)
}

Encoder.prototype.encodeBinary = function (object) {
  return encodeValue(this, object, encodeBinary)
}

Encoder.prototype.encodeArray = function (object) {
  return encodeValue(this, object, encodeArray)
}

Encoder.prototype.encodeMap = function (object) {
  return encodeValue(this, object, encodeMap)
}

Encoder.prototype.encodeExtended = function (object) {
  return encodeValue(this, object, encodeExtended)
}

Encoder.prototype.bytes = function () {
  return (this.buffer === undefined) ? new Uint8Array() : new Uint8Array(this.buffer, 0, this.length)
}

Encoder.prototype.clear = function () {
  this.buffer = undefined
  this.length = 0
}

Encoder.prototype.flush = function () {
  var bytes = this.bytes()
  this.clear()
  return bytes
}

function encode(object) {
    return (new Encoder()).encode(object).bytes()
}

exports.Encoder  = Encoder
exports.encode   = encode

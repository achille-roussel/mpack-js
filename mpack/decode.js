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

var Extended = require('./extended.js')

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

function decodeUTF8(s) {
  return decodeURIComponent(escape(s))
}

function Decoder(buffer) {
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

function decodeStringOfLength(self, length) {
  var off = self.offset
  var buf = undefined
  var str = undefined
  var i   = undefined
  var n   = undefined

  self.offset += length
  buf = new Uint8Array(self.view.buffer, self.view.byteOffset + off, length)
  str = ''

  for (i = 0, n = buf.byteLength; i !== n; ++i) {
    str += String.fromCharCode(buf[i])
  }

  return decodeUTF8(str)
}

function decodeFixstr(self, tag) {
  return decodeStringOfLength(self, tag & ~FIXSTR)
}

function decodeStr8(self) {
  return decodeStringOfLength(self, decodeUint8(self))
}

function decodeStr16(self) {
  return decodeStringOfLength(self, decodeUint16(self))
}

function decodeStr32(self) {
    return decodeStringOfLength(self, decodeUint32(self))
  }

function decodeBin8(self) {
  var length = decodeUint8(self)
  var offset = self.offset
  self.offset += length
  return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
}

function decodeBin16(self) {
  var length = decodeUint16(self)
  var offset = self.offset
  self.offset += length
  return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
}

function decodeBin32(self) {
  var length = decodeUint32(self)
  var offset = self.offset
  self.offset += length
  return new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length)
}

function decodePositiveFixnum(self, tag) {
  return tag
}

function decodeNegativeFixnum(self, tag) {
  return self.view.getInt8(self.offset - 1)
}

function decodeUint8(self) {
  var value = self.view.getUint8(self.offset)
  self.offset += 1
  return value
}

function decodeUint16(self) {
  var value = self.view.getUint16(self.offset)
  self.offset += 2
  return value
}

function decodeUint32(self) {
  var value = self.view.getUint32(self.offset)
  self.offset += 4
  return value
}

function decodeUint64(self) {
  // TODO: maybe there's a more clever way to do this.
  throw new TypeError("mpack: javascript doesn't support 64 bits integer")
}

function decodeInt8(self) {
  var value = self.view.getInt8(self.offset)
  self.offset += 1
  return value
}

function decodeInt16(self) {
  var value = self.view.getInt16(self.offset)
  self.offset += 2
  return value
}

function decodeInt32(self) {
  var value = self.view.getInt32(self.offset)
  self.offset += 4
  return value
}

function decodeInt64(self) {
  // TODO: maybe there's a more clever way to do this.
  throw new TypeError("mpack: javascript doesn't support 64 bits integer")
}

function decodeFloat32(self) {
  var value = self.view.getFloat32(self.offset)
  self.offset += 4
  return value
}

function decodeFloat64(self) {
  var value = self.view.getFloat64(self.offset)
  self.offset += 8
  return value
}

function decodeArrayOfLength(self, length) {
  var array = new Array(length)
  var index = undefined

  for (index = 0; index !== length; ++index) {
    array[index] = decodeObject(self)
  }

  return array
}

function decodeFixarray(self, tag) {
  return decodeArrayOfLength(self, tag & ~FIXARRAY)
}

function decodeArray16(self) {
  return decodeArrayOfLength(self, decodeUint16(self))
}

function decodeArray32(self) {
  return decodeArrayOfLength(self, decodeUint32(self))
}

function decodeMapOfLength(self, length) {
  var map   = { }
  var key   = undefined
  var val   = undefined
  var index = undefined

  for (index = 0; index !== length; ++index) {
    key = decodeObject(self)
    val = decodeObject(self)
    map[key] = val
  }

  return map
}

function decodeFixmap(self, tag) {
  return decodeMapOfLength(self, tag & ~FIXMAP)
}

function decodeMap16(self) {
  return decodeMapOfLength(self, decodeUint16(self))
}

function decodeMap32(self) {
  return decodeMapOfLength(self, decodeUint32(self))
}

function decodeExtendedOfLength(self, length) {
  var type   = decodeUint8(self)
  var offset = self.offset
  self.offset += length
  return new Extended(type, new Uint8Array(self.view.buffer, self.view.byteOffset + offset, length))
}

function decodeFixext1(self) {
  return decodeExtendedOfLength(self, 1)
}

function decodeFixext2(self) {
  return decodeExtendedOfLength(self, 2)
}

function decodeFixext4(self) {
  return decodeExtendedOfLength(self, 4)
}

function decodeFixext8(self) {
  return decodeExtendedOfLength(self, 8)
}

function decodeFixext16(self) {
  return decodeExtendedOfLength(self, 16)
}

function decodeExt8(self) {
  return decodeExtendedOfLength(self, decodeUint8(self))
}

function decodeExt16(self) {
  return decodeExtendedOfLength(self, decodeUint16(self))
}

function decodeExt32(self) {
  return decodeExtendedOfLength(self, decodeUint32(self))
}

function decodeObject(self) {
  var tag = decodeUint8(self)

  if ((tag & 0x80) === POSITIVE_FIXNUM) {
    return decodePositiveFixnum(self, tag)
  }

  if ((tag & 0xE0) === NEGATIVE_FIXNUM) {
    return decodeNegativeFixnum(self, tag)
  }

  if ((tag & 0xE0) === FIXSTR) {
    return decodeFixstr(self, tag)
  }

  if ((tag & 0xF0) === FIXARRAY) {
    return decodeFixarray(self, tag)
  }

  if ((tag & 0xF0) === FIXMAP) {
    return decodeFixmap(self, tag)
  }

  switch (tag) {
  case NIL:
    return null

  case FALSE:
    return false

  case TRUE:
    return true

  case STR8:
    return decodeStr8(self)

  case STR16:
    return decodeStr16(self)

  case STR32:
    return decodeStr32(self)

  case BIN8:
    return decodeBin8(self)

  case BIN16:
    return decodeBin16(self)

  case BIN32:
    return decodeBin32(self)

  case INT8:
    return decodeInt8(self)

  case INT16:
    return decodeInt16(self)

  case INT32:
    return decodeInt32(self)

  case INT64:
    return decodeInt64(self)

  case UINT8:
    return decodeUint8(self)

  case UINT16:
    return decodeUint16(self)

  case UINT32:
    return decodeUint32(self)

  case UINT64:
    return decodeUint64(self)

  case FLOAT32:
    return decodeFloat32(self)

  case FLOAT64:
    return decodeFloat64(self)

  case ARRAY16:
    return decodeArray16(self)

  case ARRAY32:
    return decodeArray32(self)

  case MAP16:
    return decodeMap16(self)

  case MAP32:
    return decodeMap32(self)

  case FIXEXT1:
    return decodeFixext1(self)

  case FIXEXT2:
    return decodeFixext2(self)

  case FIXEXT4:
    return decodeFixext4(self)

  case FIXEXT8:
    return decodeFixext8(self)

  case FIXEXT16:
    return decodeFixext16(self)

  case EXT8:
    return decodeExt8(self)

  case EXT16:
    return decodeExt16(self)

  case EXT32:
    return decodeExt32(self)

  default:
    throw new TypeError("mpack: decoder found an unknown tag: " + tag)
  }
}

Decoder.prototype.decode = function decode() {
  var offset = this.offset
  try {
    return decodeObject(this)
  }
  catch (e) {
    this.offset = offset

    if (!(e instanceof RangeError)) {
      throw e
    }
  }
}

function decode(buffer) {
  return (new Decoder(buffer)).decode()
}

module.exports = {
  Decoder : Decoder,
  decode  : decode,
}

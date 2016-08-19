//@module
/*
 *     Copyright (C) 2016 Shotaro Uchida <fantom@xmaker.mx>
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

const SLAVE_ADDR = 0x4F;

const Command = {
	NETWORK_STATUS: 0x01,
	UPDATED: 0x10,
	UNTRANSMITTED: 0x11,
	TXCH_STATUS: 0x12,
	RXCH_STATUS: 0x13,
	READ: 0x20,
	WRITE: 0x30,
	TRANSMIT: 0x40
};

const Type = {
	INT32: 0x69,	//'i'
	UINT32: 0x49,	//'I'
	INT64: 0x6C,	//'l'
	UINT64: 0x4C,	//'L'
	FLOAT: 0x66,	//'f'
	DOUBLE: 0x64,	// 'd'
	BYTES: 0x62		// 'b'
};

exports.pins = {
	power: { type: "Power", voltage: 5.0 },
	ground: { type: "Ground"},
	i2c: { type: "I2C", address: SLAVE_ADDR }
};

exports.configure = function (data) {
	this.i2c.init();
};

exports.writeChannel = function ({channel, data, type}) {
	let array;
	let typeVal;
	if (type == "bytes") {
		array = new Uint8Array(data);
	} else {
		switch (type) {
		case "int32":
			array = new Int32Array(1);
			typeVal = Type.INT32;
			break;
		case "uint32":
			array = new Uint32Array(1);
			typeVal = Type.UINT32;
			break;
		case "float":
			array = new Float32Array(1);
			typeVal = Type.FLOAT;
			break;
		case "double":
			array = new Float64Array(1);
			typeVal = Type.DOUBLE;
			break;
		}
		array[0] = data;
	}
	this.i2c.writeBlockDataSMB(Command.WRITE, channel, typeVal, array.buffer);
};

exports.readChannel = function (channel) {
	this.i2c.writeByteDataSMB(Command.READ, channel);
	let buffer = this.i2c.readBlock(9, "Buffer");
	let bytes = new Uint8Array(buffer);
	let response = {channel};
	switch (bytes[0]) {
	case Type.INT32:
		response.data = (new Int32Array(buffer.slice(1)))[0];
		response.type = "int32";
		break;
	case Type.UINT32:
		response.data = (new Uint32Array(buffer.slice(1)))[0];
		response.type = "uint32";
		break;
	case Type.FLOAT:
		response.data = (new Float32Array(buffer.slice(1)))[0];
		response.type = "float";
		break;
	case Type.UINT32:
		response.data = (new Float64Array(buffer.slice(1)))[0];
		response.type = "double";
		break;
	case Type.BYTES:
		response.data = Array.from(bytes.slice(1));
		response.type = "bytes";
		break;
	default:
		response = null;
	}
	return response;
};

exports.setTransmitMode = function (mode) {
	this.i2c.writeByteDataSMB(Command.TRANSMIT, mode);
};

exports.getTxChannelStatus = function (channel) {
	this.i2c.writeByteDataSMB(Command.TXCH_STATUS, channel);
	return this.i2c.readByte();
};

exports.getRxChannelStatus = function (channel) {
	this.i2c.writeByteDataSMB(Command.RXCH_STATUS, channel);
	return this.i2c.readByte();
};

exports.getUpdatedChannels = function (len) {
	this.i2c.writeByte(Command.UPDATED);
	let array = new Uint8Array(this.i2c.readBlock(len, "Buffer"));
	let actualLen = array[0];
	if (actualLen > 0) {
		return Array.from(array.slice(1, actualLen + 1));
	} else {
		return [];
	}	
};

exports.getUntransmittedChannels = function (len) {
	this.i2c.writeByte(Command.UNTRANSMITTED);
	let array = new Uint8Array(this.i2c.readBlock(len, "Buffer"));
	let actualLen = array[0];
	if (actualLen > 0) {
		return Array.from(array.slice(1, actualLen + 1));
	} else {
		return [];
	}
}

exports.getNetworkStatus = function () {
	this.i2c.writeByte(Command.NETWORK_STATUS);
	return this.i2c.readByte();
};

exports.close = function () {
	this.i2c.close();
};
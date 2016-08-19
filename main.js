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

import Pins from "pins";

const MAX_CHANNELS = 10;

let counter = 0;

function onUpdate(channels) {
	trace("Updates: " + JSON.stringify(channels) + "\n");
	for (let channel of channels) {
		Pins.invoke("/iot/readChannel", channel, result => {
			trace("Data From Platform: " + JSON.stringify(result) + "\n");
			Pins.invoke("/iot/getRxChannelStatus", channel, result => {
				trace("Rx Status: ch=" + channel + ", r=" + result + "\n");
			});
		});
	}
	updateCounter();
}

function updateCounter() {
	Pins.invoke("/iot/writeChannel", {
		channel: 0,
		data: counter++,
		type: "int32"
	});
}

Pins.configure({
	iot: {
		require: "sakuraiot",
		pins: {
			i2c: { sda: 27, clock: 29 }
		}
	}
}, success => {
	Pins.invoke("/iot/getNetworkStatus", result => {
		trace("Network Status: " + result + "\n");
		if (result == 1) {
			Pins.invoke("/iot/setTransmitMode", 1);
			Pins.repeat("/iot/getUpdatedChannels", MAX_CHANNELS, 5000, result => {
				onUpdate(result);
			});
		}
	});
});
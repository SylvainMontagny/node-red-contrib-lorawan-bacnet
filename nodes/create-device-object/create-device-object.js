module.exports = function(RED) {
    function CreateDeviceObject(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function(msg) {
            let deviceList = global.get('g_deviceList');
            let networkServer;
            let deviceName, deviceType, deviceNum, devEUI, topicDownlink;
            let devicePayload = {};
            
            let topicUp = msg.topic;
            
            // Guess the NetworkServer from the received frame
            if (msg.payload.hasOwnProperty('deviceInfo'))       networkServer = "chirpstack";
            if (msg.payload.hasOwnProperty('end_device_ids'))   networkServer = "tts";
            if (msg.payload.hasOwnProperty('DevEUI_uplink'))    networkServer = "actility";
            
            // Reject messages from Actility :
            if ( 'DevEUI_notification' in msg.payload || 'DevEUI_notification' in msg.payload)  return null;
            if ( 'DevEUI_downlink_Rejected' in msg.payload) {
                node.error("Actility : Downlink Message Rejected");
                return null;
            }
            
            //////////////////////////////////////////////////////////////////////////
            // The Things Stack Network Server 
            /////////////////////////////////////////////////////////////////////////
            
            if (networkServer == "tts") {
                deviceName = msg.payload.end_device_ids.device_id;
                topicDownlink = topicUp.replace(global.get('g_tts_topicUplinkSuffix'), "") + global.get('g_tts_topicDownlinkSuffix');
                devEUI = msg.payload.end_device_ids.dev_eui;
                if (!Object.keys(msg.payload.uplink_message).some(element => element == "decoded_payload")) {
                    node.error(deviceName + " : No payload decoder configured on the Network Server");
                    return null;
                }
                devicePayload = msg.payload.uplink_message.decoded_payload;
            }
            
            
            //////////////////////////////////////////////////////////////////////////
            // Chirpstack Network Server 
            /////////////////////////////////////////////////////////////////////////
            
            if (networkServer == "chirpstack") {
                if (msg.payload.fPort == 0) return 0;
                deviceName = msg.payload.deviceInfo.deviceName;
                topicDownlink = topicUp.replace(global.get('g_chirp_topicUplinkSuffix'), "") + global.get('g_chirp_topicDownlinkSuffix');
                devEUI = msg.payload.deviceInfo.devEui;
                if (!Object.keys(msg.payload).some(element => element == "object")) {
                    node.error(deviceName + " : No payload decoder configured on the Network Server");
                    return null;
                }
                devicePayload = msg.payload.object;
            }
            
            //////////////////////////////////////////////////////////////////////////
            // Actility Network Server 
            /////////////////////////////////////////////////////////////////////////
            
            if (networkServer == "actility") {
                deviceName = msg.payload.DevEUI_uplink.CustomerData.name;
                topicDownlink = topicUp.replace(global.get('g_actility_topicUplinkSuffix'), "") + global.get('g_actility_topicDownlinkSuffix');
                devEUI = msg.payload.DevEUI_uplink.DevEUI;
                if (!Object.keys(msg.payload.DevEUI_uplink).some(element => element == "payload")) {
                    node.error(deviceName + " : No payload decoder configured on the Network Server");
                    return null;
                }
                devicePayload = msg.payload.DevEUI_uplink.payload;
            }
            
            //////////////////////////////////////////////////////////////////////////
            // Checks
            /////////////////////////////////////////////////////////////////////////
            const match = deviceName.match(/^(.*)-(\d+)$/);
            if (match) {
                deviceType = match[1];  // The part before the last dash
                deviceNum = parseInt(match[2], 10);  // The number at the end, converted to an integer
            }
            else {
                node.error(`${deviceName} : this device Name doesn't respect "xxx-num" format`);
                return null;
            }
            
            if ((deviceNum == 0)) {
                node.error(`${deviceName} : Device Num is 0 is not allowed`);
                return null;
            }
            
            if (deviceList[deviceType] == undefined) {
                node.error(`${deviceType} : this Device Type doesn't belong to the Device List`);
                return null;
            }
            
            // Check deviceNum overflow
            if (deviceNum > deviceList[deviceType].identity.maxDeviceNum) {
                node.error(`Device "${deviceName}" (instances up to ${deviceList[deviceType].bacnet.offset + deviceNum * deviceList[deviceType].bacnet.instanceRange + deviceList[deviceType].bacnet.instanceRange - 1}) overlaps another device (starts at ${deviceList[deviceType].bacnet.offset + (deviceList[deviceType].identity.maxDeviceNum + 1) * deviceList[deviceType].bacnet.instanceRange}) : Dropped`);
                return null;
            }
            
            //////////////////////////////////////////////////////////////////////////
            // Create a copy of the "deviceType" object of the "deviceList" structure
            /////////////////////////////////////////////////////////////////////////
            let device = JSON.parse(JSON.stringify(deviceList[deviceType]));
            
            device.identity.deviceName = deviceName;
            device.identity.deviceType = deviceType;
            device.identity.deviceNum = deviceNum;
            device.identity.devEUI = devEUI;
            device.mqtt.topicDownlink = topicDownlink;
            
            for (let object in device.bacnet.objects) {
                // Update instanceNum
                device.bacnet.objects[object].instanceNum += device.bacnet.offset + (device.bacnet.instanceRange * deviceNum);
                // Update objectName
                device.bacnet.objects[object].objectName = deviceName + '-' + object + '-' + device.bacnet.objects[object].instanceNum;
                // Update value
                if (device.bacnet.objects[object].dataDirection == "uplink") {
                    let lorawanPayloadName = device.bacnet.objects[object].lorawanPayloadName;
                    let keys = lorawanPayloadName.split(/[\.\[\]]/).filter(key => key !== "");
                    let value = keys.reduce((accumulator, currentValue) => accumulator[currentValue], devicePayload);
                    device.bacnet.objects[object].value = value;
                }
                // Check value
                if (device.bacnet.objects[object].value == undefined || typeof device.bacnet.objects[object].value == "object") {
                    node.error(`Device : ${device.identity.deviceName} - Object : ${object} - Wrong Payload decoder or Wrong Device description`);
                    return null;
                }
            
                if (device.controller.protocol == "bacnet") {
                    // "restAPIBacnet" and "bacnet" compatibility 
                    switch (device.bacnet.objects[object].objectType) {
                        case "analogValue": device.bacnet.objects[object].objectType = 2; break;
                        case "binaryValue": device.bacnet.objects[object].objectType = 5; break;
                    }
                    // Keep only uplink payload in a new object
                    device.bacnet.uplinkKeys = Object.entries(device.bacnet.objects)
                        .filter(([key, obj]) => obj.dataDirection === "uplink")
                        .map(([key, obj]) => key);
                }
            }
            
            // For debug
            device.transmitTime = Date.now();
            
            // For InfluxDB support
            device.influxdb = {
                "source": "uplink"
            };
            const result = {
                "device": device
            }
            node.send(result);
        });
    }

    RED.nodes.registerType("create device object", CreateDeviceObject);
}

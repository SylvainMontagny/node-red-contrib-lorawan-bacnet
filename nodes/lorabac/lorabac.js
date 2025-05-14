module.exports = function (RED) {
    function LoRaBAC(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const flow = node.context().flow;

        node.warn(config.deviceList); // Display in debug
        
        let status = verifyDeviceList(config.deviceList);
        displayStatus(node, status);
        if (status.ok) {
            if (config.globalConfig.protocol === "restAPIBacnet") {
                generateHttpAuthentication(config.deviceList);
            }
            setupGlobalVariables(this, config);
        }

        node.on("input", function (msg) {
            let device = createObject(this, msg);
            const result = {
                "device": device,
            }
            node.send(result);
        });

    }

    // ==================================================
    // ============== UTIL FUNCTIONS ====================
    // ==================================================

    function generateHttpAuthentication(deviceList) {
        for (let device in deviceList) {
            const buffer = Buffer.from(deviceList[device].controller.login + ':' + deviceList[device].controller.password);
            deviceList[device].controller.httpAuthentication = "Basic " + buffer.toString('base64');
        }
    }

    function displayStatus(node, status){
        if (status.ok) {
            node.status({ fill: "green", shape: "dot", text: "Configuration OK" });
        } else {
            let message = status.message;
            delete status.ok
            delete status.message
            node.status({
                fill: "red",
                shape: "dot",
                text: message || "Invalid configuration"
            });
            node.error(`Error in device list : ${message}`, status);
        }
    }


    function setupGlobalVariables(node, config) {
        const flow = node.context().flow;

        flow.set('g_deviceList', config.deviceList);

        flow.set('g_httpRequestTimeOut', 5000);
        flow.set('g_tts_topicDownlinkSuffix', "/down");
        flow.set('g_tts_topicUplinkSuffix', "/up");
        flow.set('g_chirp_topicDownlinkSuffix', "/command/down");
        flow.set('g_chirp_topicUplinkSuffix', "/event/up");
        flow.set('g_actility_topicDownlinkSuffix', "/downlink");
        flow.set('g_actility_topicUplinkSuffix', "/uplink");
        if (flow.get("g_previousValues") === undefined) {
            flow.set("g_previousValues", {});
        }

        const debug = function (device, debugType, debugText) {
            if (debugType == "forceOn") {
                node.warn(debugText);
            }
            else if (device.controller.debug.some(element => element == "all" || element == debugType)) {
                node.warn(debugText);
            }
            else {
                return;
            }
        }
        flow.set("g_debug", debug);
    }

    function createObject(node, msg){
        const flow = node.context().flow;
        
        let deviceList = flow.get('g_deviceList');
        let networkServer;
        let deviceName, deviceType, deviceNum, devEUI, topicDownlink;
        let devicePayload = {};
        let previousValues = flow.get("g_previousValues");

        let topicUp = msg.topic;

        // Guess the NetworkServer from the received frame
        if (msg.payload.hasOwnProperty('deviceInfo')) networkServer = "chirpstack";
        if (msg.payload.hasOwnProperty('end_device_ids')) networkServer = "tts";
        if (msg.payload.hasOwnProperty('DevEUI_uplink')) networkServer = "actility";

        // Reject messages from Actility :
        if ('DevEUI_notification' in msg.payload || 'DevEUI_notification' in msg.payload) return null;
        if ('DevEUI_downlink_Rejected' in msg.payload) {
            node.error("Actility : Downlink Message Rejected");
            return null;
        }

        //////////////////////////////////////////////////////////////////////////
        // The Things Stack Network Server 
        /////////////////////////////////////////////////////////////////////////

        if (networkServer == "tts") {
            deviceName = msg.payload.end_device_ids.device_id;
            topicDownlink = topicUp.replace(flow.get('g_tts_topicUplinkSuffix'), "") + flow.get('g_tts_topicDownlinkSuffix');
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
            topicDownlink = topicUp.replace(flow.get('g_chirp_topicUplinkSuffix'), "") + flow.get('g_chirp_topicDownlinkSuffix');
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
            topicDownlink = topicUp.replace(flow.get('g_actility_topicUplinkSuffix'), "") + flow.get('g_actility_topicDownlinkSuffix');
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
            node.error("Error: Device Name does not respect *xxx - num* format",
                {
                    errorType: "deviceName",
                    value: deviceName,
                });
            return null;
        }

        if ((deviceNum == 0)) {
            node.error('Error: Device Num is 0 is not allowed',
                {
                    errorType: "deviceName",
                    value: deviceName,
                });
            return null;
        }

        if (deviceList[deviceType] == undefined) {
            node.error('Error: Device Type does not belong to the Device List',
                {
                    errorType: "deviceName",
                    value: deviceName,
                });
            return null;
        }

        // Check deviceNum overflow
        if (deviceNum > deviceList[deviceType].identity.maxDevNum) {
            node.error('Error: Device number is too high',
                {
                    errorType: "deviceName",
                    value: deviceName,
                });
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
            switch (device.bacnet.objects[object].assignementMode) {
                case "manual":

                    break;
                case "auto":
                    switch (device.bacnet.objects[object].objectType) {
                        case "analogValue":
                            device.bacnet.objects[object].instanceNum += device.bacnet.offsetAV + (device.bacnet.instanceRangeAV * deviceNum);
                            break;
                        case "binaryValue":
                            device.bacnet.objects[object].instanceNum += device.bacnet.offsetBV + (device.bacnet.instanceRangeBV * deviceNum);
                            break;
                        default:
                            node.error("Object type of " + object + " is unknown : " + device.bacnet.objects[object].objectType);
                            return null;

                    }
                    break;
                default:

            }

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
        // To save previous values
        if (!previousValues.hasOwnProperty(device.identity.deviceName)) {

            previousValues[device.identity.deviceName] = RED.util.cloneMessage(device);

        }

        return device;
    }

    function verifyDeviceList(deviceList) {
        const networkServerSupported = ["tts", "chirpstack", "actility"];
        const protocolSupported = ["restAPIBacnet", "bacnet"];

        let objectInstanceArrayAV = [], objectInstanceArrayBV = [];
        let objectInstanceArrayAVManual = [], objectInstanceArrayBVManual = [];

        for (let device in deviceList) {
            const dev = deviceList[device];

            if (!networkServerSupported.includes(dev.lorawan.networkServer)) {
                return {
                    ok: false,
                    errorType: "deviceListLoRaWANConfiguration",
                    message: "Network Server not supported",
                    device,
                    property: "networkServer",
                    value: dev.lorawan.networkServer
                };
            }

            for (let object in dev.bacnet.objects) {
                const obj = dev.bacnet.objects[object];

                const requiredProps = ["lorawanPayloadName", "objectType", "assignementMode", "instanceNum", "dataDirection", "value"];
                for (const prop of requiredProps) {
                    if (!obj.hasOwnProperty(prop)) {
                        return {
                            ok: false,
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            message: `Missing object property: ${prop}`,
                            device,
                            object,
                            property: prop
                        };
                    }
                }

                if (obj.dataDirection === "downlink") {
                    const downlinkProps = ["downlinkPort", "downlinkPortPriority", "downlinkStrategy"];
                    for (const prop of downlinkProps) {
                        if (!obj.hasOwnProperty(prop)) {
                            return {
                                ok: false,
                                errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                message: `Missing downlink property: ${prop}`,
                                device,
                                object,
                                property: prop
                            };
                        }
                    }

                    if (obj.downlinkStrategy === "compareToUplinkValue" && !obj.hasOwnProperty("uplinkToCompareWith")) {
                        return {
                            ok: false,
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            message: "Missing uplinkToCompareWith for compareToUplinkValue strategy",
                            device,
                            object,
                            property: "uplinkToCompareWith"
                        };
                    }

                    if (obj.downlinkStrategy === "onChangeOfValueWithinRange") {
                        if (!obj.hasOwnProperty("range")) {
                            return {
                                ok: false,
                                errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                message: "Missing range for onChangeOfValueWithinRange strategy",
                                device,
                                object,
                                property: "range"
                            };
                        }
                        if (obj.range.length !== 2 || obj.range[1] < obj.range[0]) {
                            return {
                                ok: false,
                                errorType: "deviceListBACnetObjectConfiguration",
                                message: "Invalid range configuration",
                                device,
                                object,
                                property: "range",
                                value: obj.range
                            };
                        }
                    }
                }
            }

            if (!protocolSupported.includes(dev.controller.protocol)) {
                return {
                    ok: false,
                    errorType: "deviceListControllerConfiguration",
                    message: "Controller protocol not supported",
                    device,
                    property: "protocol",
                    value: dev.controller.protocol
                };
            }

            let instanceRangeAV = 0, instanceRangeBV = 0;
            let assignementMode = null;

            for (let object in dev.bacnet.objects) {
                const obj = dev.bacnet.objects[object];

                if (assignementMode === null) {
                    assignementMode = obj.assignementMode;
                } else if (assignementMode !== obj.assignementMode) {
                    return {
                        ok: false,
                        errorType: "deviceListBACnetObjectConfiguration",
                        message: "Objects have different assignement modes",
                        device,
                        object,
                        property: "assignementMode",
                        value: obj.assignementMode
                    };
                }

                if (obj.instanceNum < 0) {
                    return {
                        ok: false,
                        errorType: "deviceListBACnetObjectConfiguration",
                        message: "Negative instanceNum",
                        device,
                        object,
                        property: "instanceNum",
                        value: obj.instanceNum
                    };
                }

                if (obj.objectType === "analogValue") {
                    if (obj.assignementMode !== "manual" && obj.instanceNum >= dev.bacnet.instanceRangeAV) {
                        return {
                            ok: false,
                            errorType: "deviceListBACnetObjectConfiguration",
                            message: "Analog instanceNum too high",
                            device,
                            object,
                            property: "instanceNum",
                            value: obj.instanceNum
                        };
                    } else if (obj.assignementMode === "manual") {
                        objectInstanceArrayAVManual.push(obj.instanceNum);
                    } else {
                        instanceRangeAV++;
                    }
                }

                if (obj.objectType === "binaryValue") {
                    if (obj.assignementMode !== "manual" && obj.instanceNum >= dev.bacnet.instanceRangeBV) {
                        return {
                            ok: false,
                            errorType: "deviceListBACnetObjectConfiguration",
                            message: "Binary instanceNum too high",
                            device,
                            object,
                            property: "instanceNum",
                            value: obj.instanceNum
                        };
                    } else if (obj.assignementMode === "manual") {
                        objectInstanceArrayBVManual.push(obj.instanceNum);
                    } else {
                        instanceRangeBV++;
                    }
                }
            }

            if (dev.bacnet.instanceRangeAV < instanceRangeAV) {
                return {
                    ok: false,
                    errorType: "deviceListBACnetConfiguration",
                    message: "InstanceRangeAV too small",
                    device,
                    property: "instanceRangeAV",
                    value: dev.bacnet.instanceRangeAV
                };
            }
            if (dev.bacnet.instanceRangeBV < instanceRangeBV) {
                return {
                    ok: false,
                    errorType: "deviceListBACnetConfiguration",
                    message: "InstanceRangeBV too small",
                    device,
                    property: "instanceRangeBV",
                    value: dev.bacnet.instanceRangeBV
                };
            }

            objectInstanceArrayAV.push({ device, offset: dev.bacnet.offsetAV, instanceRange: dev.bacnet.instanceRangeAV, maxdevNum: dev.identity.maxDevNum });
            objectInstanceArrayBV.push({ device, offset: dev.bacnet.offsetBV, instanceRange: dev.bacnet.instanceRangeBV, maxdevNum: dev.identity.maxDevNum });
        }

        objectInstanceArrayAV.sort((a, b) => a.offset - b.offset);
        objectInstanceArrayBV.sort((a, b) => a.offset - b.offset);

        for (let i = 0; i < objectInstanceArrayAV.length - 1; i++) {
            const current = objectInstanceArrayAV[i];
            const next = objectInstanceArrayAV[i + 1];
            if (current.offset + current.instanceRange * current.maxdevNum > next.offset) {
                return {
                    ok: false,
                    errorType: "deviceListOverlap",
                    message: "Analog BACnet objects overlap",
                    device1: current.device,
                    device2: next.device
                };
            }

            for (let inst of objectInstanceArrayAVManual) {
                if (inst >= current.offset && inst < current.offset + current.instanceRange * current.maxdevNum) {
                    return {
                        ok: false,
                        errorType: "deviceListOverlapManual",
                        message: "Manual analog object instance overlaps another device's range",
                        device: current.device,
                        instanceNum: inst
                    };
                }
            }
        }

        for (let i = 0; i < objectInstanceArrayBV.length - 1; i++) {
            const current = objectInstanceArrayBV[i];
            const next = objectInstanceArrayBV[i + 1];
            if (current.offset + current.instanceRange * current.maxdevNum > next.offset) {
                return {
                    ok: false,
                    errorType: "deviceListOverlap",
                    message: "Binary BACnet objects overlap",
                    device1: current.device,
                    device2: next.device
                };
            }

            for (let inst of objectInstanceArrayBVManual) {
                if (inst >= current.offset && inst < current.offset + current.instanceRange * current.maxdevNum) {
                    return {
                        ok: false,
                        errorType: "deviceListOverlapManual",
                        message: "Manual binary object instance overlaps another device's range",
                        device: current.device,
                        instanceNum: inst
                    };
                }
            }
        }

        return { ok: true };
    }


    RED.nodes.registerType("LoRaBAC", LoRaBAC);
};

module.exports = function (RED) {
    function LoRaBACConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        setupGlobalVariables(this, config);
        checkConfigurationSettings(this, config);

        node.on("input", function (msg) {
            let deviceList = config.deviceList || {};

            if (config.globalConfig.protocol === "restAPIBacnet") {
                generateHttpAuthentication(deviceList);
            }

            msg.payload = deviceList;
            node.send(msg);
        });

    }

    function generateHttpAuthentication(deviceList) {
        for (let device in deviceList) {
            const buffer = Buffer.from(deviceList[device].controller.login + ':' + deviceList[device].controller.password);
            deviceList[device].controller.httpAuthentication = "Basic " + buffer.toString('base64');
        }
    }


    function setupGlobalVariables(node, config) {
        const flow = node.context().flow;

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

    function checkConfigurationSettings(node, config) {
        let deviceList = config.deviceList || {};
        const flow = node.context().flow;
        const networkServerSupported = ["tts", "chirpstack", "actility"];
        const protocolSupported = ["restAPIBacnet", "bacnet"];

        let objectInstanceArrayAV = [], objectInstanceArrayBV = [];
        let objectInstanceArrayAVManual = [], objectInstanceArrayBVManual = [];
        let maxDevNumAV, maxDevNumBV;

        for (let device in deviceList) {
            // Check LoRaWAN Network Servers ["tts", "chirpstack", "actility"]
            if (!networkServerSupported.some(element => element == deviceList[device].lorawan.networkServer)) {
                node.error("Error Unknown network server",
                    {
                        errorType: "deviceListLoRaWANConfiguration",
                        device: device,
                        property: "networkServer",
                        value: deviceList[device].lorawan.networkServer
                    });

                node.status({ fill: "red", shape: "dot", text: "Network Server not supported" });
                return;
            }

            // Check that bacnetObject had every necessary properties
            for (let object in deviceList[device].bacnet.objects) {
                if (!deviceList[device].bacnet.objects[object].hasOwnProperty("lorawanPayloadName")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "lorawanPayloadName"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("objectType")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "objectType"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("assignementMode")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "assignementMode"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("instanceNum")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "instanceNum"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("dataDirection")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "dataDirection"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("value")) {
                    node.error("Error missing object property",
                        {
                            errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                            device: device,
                            object: object,
                            property: "value"
                        });
                    node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                    return;
                } else if (deviceList[device].bacnet.objects[object].dataDirection === "downlink") {

                    if (!deviceList[device].bacnet.objects[object].hasOwnProperty("downlinkPort")) {
                        node.error("Error missing object property",
                            {
                                errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                device: device,
                                object: object,
                                property: "downlinkPort"
                            });
                        node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                        return;
                    } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("downlinkPortPriority")) {
                        node.error("Error missing object property",
                            {
                                errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                device: device,
                                object: object,
                                property: "downlinkPortPriority"
                            });
                        node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                        return;
                    } else if (!deviceList[device].bacnet.objects[object].hasOwnProperty("downlinkStrategy")) {
                        node.error("Error missing object property",
                            {
                                errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                device: device,
                                object: object,
                                property: "downlinkStrategy"
                            });
                        node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                        return;
                    } else if (deviceList[device].bacnet.objects[object].downlinkStrategy === "compareToUplinkValue") {

                        if (!deviceList[device].bacnet.objects[object].hasOwnProperty("uplinkToCompareWith")) {
                            node.error("Error missing object property",
                                {
                                    errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                    device: device,
                                    object: object,
                                    property: "uplinkToCompareWith"
                                });
                            node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                            return;
                        }
                    } else if (deviceList[device].bacnet.objects[object].downlinkStrategy === "onChangeOfValueWithinRange") {
                        if (!deviceList[device].bacnet.objects[object].hasOwnProperty("range")) {
                            node.error("Error missing object property",
                                {
                                    errorType: "deviceListBACnetObjectConfigurationMissingProperty",
                                    device: device,
                                    property: "range"
                                });
                            node.status({ fill: "red", shape: "dot", text: "Missing object property" });
                            return;
                        } else if (deviceList[device].bacnet.objects[object].range.length != 2 || deviceList[device].bacnet.objects[object].range[1] < deviceList[device].bacnet.objects[object].range[0]) {
                            node.error("Error incorrect range",
                                {
                                    errorType: "deviceListBACnetObjectConfiguration",
                                    device: device,
                                    property: "range",
                                    object: object,
                                    value: deviceList[device].bacnet.objects[object].range,
                                });
                            node.status({ fill: "red", shape: "dot", text: "incorrect range" });
                            return;
                        }
                    }
                }
            }

            // Check device.controller.protocol ["restAPIBacnet", "bacnet"]
            if (!protocolSupported.some(element => element == deviceList[device].controller.protocol)) {
                node.error("Error Unknown controller protocol",
                    {
                        errorType: "deviceListControllerConfiguration",
                        device: device,
                        property: "protocol",
                        value: deviceList[device].controller.protocol
                    });
                node.status({ fill: "red", shape: "dot", text: "Controller protocol not supported" });
                return;
            }

            // Check device.bacnet.instanceRange >= Number of BACnet object in the deviceList
            let instanceRangeAV = 0, instanceRangeBV = 0;
            let assignementMode = null

            for (let object in deviceList[device].bacnet.objects) {
                if (assignementMode === null) {
                    assignementMode = deviceList[device].bacnet.objects[object].assignementMode
                } else if (assignementMode != deviceList[device].bacnet.objects[object].assignementMode) {
                    node.error("Error Objects have different assignement mode",
                        {
                            errorType: "deviceListBACnetObjectConfiguration",
                            device: device,
                            property: "assignementMode",
                            object: object,
                            objectType: "any",
                            value: deviceList[device].bacnet.objects[object].assignementMode,
                        });
                    node.status({ fill: "red", shape: "dot", text: object + " different assignement mode" });
                    return
                }
                switch (deviceList[device].bacnet.objects[object].objectType) {
                    case "analogValue":
                        if (deviceList[device].bacnet.objects[object].instanceNum >= deviceList[device].bacnet.instanceRangeAV && deviceList[device].bacnet.objects[object].assignementMode != "manual") {
                            node.error("Error InstanceNum too high",
                                {
                                    errorType: "deviceListBACnetObjectConfiguration",
                                    device: device,
                                    property: "instanceNum",
                                    object: object,
                                    objectType: "analog value",
                                    value: deviceList[device].bacnet.objects[object].instanceNum,
                                });
                            node.status({ fill: "red", shape: "dot", text: object + " instanceNum too high" });
                            return;
                        } else if (deviceList[device].bacnet.objects[object].assignementMode === "manual") {
                            objectInstanceArrayAVManual.push(deviceList[device].bacnet.objects[object].instanceNum)
                        } else {
                            instanceRangeAV++;
                        }
                        break;
                    case "binaryValue":
                        if (deviceList[device].bacnet.objects[object].instanceNum >= deviceList[device].bacnet.instanceRangeBV && deviceList[device].bacnet.objects[object].assignementMode != "manual") {
                            node.error("Error InstanceNum too high",
                                {
                                    errorType: "deviceListBACnetObjectConfiguration",
                                    device: device,
                                    property: "instanceNum",
                                    object: object,
                                    objectType: "binary value",
                                    value: deviceList[device].bacnet.objects[object].instanceNum,
                                });
                            node.status({ fill: "red", shape: "dot", text: object + " instanceNum too high" });
                            return;
                        } else if (deviceList[device].bacnet.objects[object].assignementMode === "manual") {
                            objectInstanceArrayBVManual.push(deviceList[device].bacnet.objects[object].instanceNum)
                        } else {
                            instanceRangeBV++;
                        }
                        break;
                    default:

                }
                if (deviceList[device].bacnet.objects[object].instanceNum < 0) {
                    node.error("Error Negative instanceNum",
                        {
                            errorType: "deviceListBACnetObjectConfiguration",
                            device: device,
                            property: "instanceNum",
                            object: object,
                            objectType: "any",
                            value: deviceList[device].bacnet.objects[object].instanceNum
                        });
                    node.status({ fill: "red", shape: "dot", text: object + "Negative instanceNum" });
                    return;
                }
            }
            if (deviceList[device].bacnet.instanceRangeAV < instanceRangeAV) {
                node.error("Error InstanceRange too small",
                    {
                        errorType: "deviceListBACnetConfiguration",
                        device: device,
                        property: "instanceRangeAV",
                        value: deviceList[device].bacnet.instanceRangeAV,
                    });
                node.status({ fill: "red", shape: "dot", text: "InstanceRange too small" });
                return;
            }
            if (deviceList[device].bacnet.instanceRangeBV < instanceRangeBV) {
                node.error("Error InstanceRange too small",
                    {
                        errorType: "deviceListBACnetConfiguration",
                        device: device,
                        property: "instanceRangeBV",
                        value: deviceList[device].bacnet.instanceRangeBV,
                    });
                node.status({ fill: "red", shape: "dot", text: "InstanceRange too small" });
                return;
            }

            // Build an array with offsetAV, instanceRangeAV, maxDeviceNum and device
            objectInstanceArrayAV.push({ "device": device, "offset": deviceList[device].bacnet.offsetAV, "instanceRange": deviceList[device].bacnet.instanceRangeAV, "maxdevNum": deviceList[device].identity.maxDevNum });
            // Build another array with offsetAV, instanceRangeBV, instanceRangeAV and device
            objectInstanceArrayBV.push({ "device": device, "offset": deviceList[device].bacnet.offsetBV, "instanceRange": deviceList[device].bacnet.instanceRangeBV, "maxdevNum": deviceList[device].identity.maxDevNum });
        }

        // Check that offset and instanceRange don't overlap and that there is not any manual object in another device object instance range.
        objectInstanceArrayAV.sort((a, b) => a.offset - b.offset);
        objectInstanceArrayBV.sort((a, b) => a.offset - b.offset);
        for (let i = 0; i < objectInstanceArrayAV.length - 1; i++) {
            if (objectInstanceArrayAV[i].instanceRange != 0) {
                for (let i = 0; i < objectInstanceArrayAVManual.length; i++) {

                    if (objectInstanceArrayAV[i].offset + objectInstanceArrayAV[i].instanceRange * objectInstanceArrayAV[i].maxdevNum > objectInstanceArrayAV[i + 1].offset) {
                        node.error("Error Analog values BACnet objects of devices overlap",
                            {
                                errorType: "deviceListOverlap",
                                device1: objectInstanceArrayAV[i].device,
                                device2: objectInstanceArrayAV[i + 1].device,
                            });
                        node.status({ fill: "red", shape: "dot", text: "BACnet objects instances overlap" });
                        return;
                    } else if (objectInstanceArrayAVManual[i] >= objectInstanceArrayAV[i].offset && objectInstanceArrayAVManual[i] <= objectInstanceArrayAV[i].offset + objectInstanceArrayAV[i].instanceRange * objectInstanceArrayAV[i].maxdevNum) {
                        node.error("Error Analog values BACnet objects of devices overlap with a manually set object instance",
                            {
                                errorType: "deviceListOverlapManual",
                                device: objectInstanceArrayAV[i].device,
                                instanceNum: objectInstanceArrayAVManual[i],
                            });
                        node.status({ fill: "red", shape: "dot", text: "BACnet objects instances overlap a manually set object instance " });
                        return;
                    }
                }
            }
            if (objectInstanceArrayBV[i].instanceRange != 0) {
                for (let i = 0; i < objectInstanceArrayBVManual.length; i++) {

                    if (objectInstanceArrayBV[i].offset + objectInstanceArrayBV[i].instanceRange * objectInstanceArrayBV[i].maxdevNum > objectInstanceArrayBV[i + 1].offset) {
                        node.error("Error Binary values BACnet objects of devices overlap",
                            {
                                errorType: "deviceListOverlap",
                                device1: objectInstanceArrayBV[i].device,
                                device2: objectInstanceArrayBV[i + 1].device,
                            });
                        node.status({ fill: "red", shape: "dot", text: "BACnet objects instances overlap" });
                        return;
                    } else if (objectInstanceArrayBVManual[i] >= objectInstanceArrayBV[i].offset && objectInstanceArrayBVManual[i] <= objectInstanceArrayBV[i].offset + objectInstanceArrayBV[i].instanceRange * objectInstanceArrayBV[i].maxdevNum) {
                        node.error("Error Binary values BACnet objects of devices overlap with a manually set object instance",
                            {
                                errorType: "deviceListOverlapManual",
                                device: objectInstanceArrayBV[i].device,
                                instanceNum: objectInstanceArrayBVManual[i],
                            });
                        node.status({ fill: "red", shape: "dot", text: "BACnet objects instances overlap a manually set object instance " });
                        return;
                    }
                }
            }
        }

        ////////////////////////////////////
        // Return if all checkings are clear
        ///////////////////////////////////
        node.status({ fill: "green", shape: "dot", text: "Configuration OK" });
        flow.set('g_deviceList', deviceList)
    }

    RED.nodes.registerType("LoRaBAC configuration", LoRaBACConfiguration);
};

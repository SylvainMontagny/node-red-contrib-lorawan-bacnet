module.exports = function (RED) {
    function LoRaBACConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const flow = node.context().flow;

        setupGlobalVariables(this, config);
        let status = verifyDeviceList(config.deviceList);
        displayStatus(node, status);
        if (status.ok) {
            flow.set('g_deviceList', config.deviceList);
        }

        node.on("input", function (msg) {
            let deviceList = config.deviceList || {};

            if (config.globalConfig.protocol === "restAPIBacnet") {
                generateHttpAuthentication(deviceList);
            }

            msg.payload = deviceList;
            node.send(msg);
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


    RED.nodes.registerType("LoRaBAC configuration", LoRaBACConfiguration);
};

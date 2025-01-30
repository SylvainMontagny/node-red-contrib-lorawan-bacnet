const tools = require("../shared/tools.js");

module.exports = function (RED) {
    function DeviceConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        const debugDefault = ["all"];                                                             // ["all", "up", "down", "creation", "txTime"]
        const ipAddress = config.ipAddress || "TO_CONFIGURE";                                     // "a.b.c.d"
        const networkServer = config.networkServer || "TO_CONFIGURE";                             // tts, chirpstack, actility 
        const protocol = config.protocol || "restAPIBacnet";                                      // restAPIBacnet, bacnet, later : restAPIModbus, modbus
        const chirpstackGrpcApikey = config.grpcApikey || "TO_CONFIGURE_IF_USING_CHIRPSTACK";     // chirpstack only
        const login = config.bacnetLogin || "TO_CONFIGURE_IF_USING_restAPIBacnet";
        const password = config.bacnetPassword || "TO_CONFIGURE_IF_USING_restAPIBacnet";


        let deviceList = {

            //////////////////////////////////////////////////////////////////////////
            // valve simulation - STM32WL Nucleo
            /////////////////////////////////////////////////////////////////////////
            "usmb-valve": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,//debugDefault, // ["all"],
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,

                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": 30,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    },
                    "actility": {
                        "driver": {
                            "pId": "usmb",
                            "mId": "valve",
                            "ver": "1"
                        }
                    }
                },
                "bacnet": {
                    "offset": 0,
                    "instanceRange": 10,
                    "objects": {
                        "valveSetpoint": { "lorawanPayloadName": "valveSetpoint", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "valveTemperature": { "lorawanPayloadName": "valveTemperature", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "controllerSetpoint": { "lorawanPayloadName": "controllerSetpoint", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "downlink", "value": 20 }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },
            //////////////////////////////////////////////////////////////////////////
            // Temperature-Humidity sensor - LHT-65
            /////////////////////////////////////////////////////////////////////////

            "dragino-lht65": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    },
                    "actility": {
                        "driver": {
                            "pId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "mId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "ver": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK"
                        }
                    }
                },
                "bacnet": {
                    "offset": 1000,
                    "instanceRange": 5,
                    "objects": {
                        "temperature": { "lorawanPayloadName": "TempC_SHT", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "humidity": { "lorawanPayloadName": "Hum_SHT", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "batteryVoltage": { "lorawanPayloadName": "BatV", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },



            //////////////////////////////////////////////////////////////////////////
            // Temperature and Humidity sensor - WATTECO Tempo
            /////////////////////////////////////////////////////////////////////////
            "watteco-tempo": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,  //debugDefault, //["all"],
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    }
                },
                "bacnet": {
                    "offset": 2000,
                    "instanceRange": 5,
                    "objects": {
                        "temperature": { "lorawanPayloadName": "data[5].value", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "humidity": { "lorawanPayloadName": "data[11].value", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // C02 - Temperature - Humidity sensor - ATIM THAQ
            /////////////////////////////////////////////////////////////////////////
            "atim-thaq": {
                "identity": {},
                "controller": {
                    "debug": debugDefault, //debugDefault, //["all"],
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    }
                },
                "bacnet": {
                    "offset": 2100,
                    "instanceRange": 5,
                    "objects": {
                        "co2": { "lorawanPayloadName": "C02.value[0]", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "humidity": { "lorawanPayloadName": "humidity0.value[0]", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "cov": { "lorawanPayloadName": "COV.value[0]", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "uplink", "value": null },
                        "temperature": { "lorawanPayloadName": "temperature0.value[0]", "objectType": "analogValue", "instanceNum": 3, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // C02 - Temperature - Humidity sensor - ELSYS ERS2C02
            /////////////////////////////////////////////////////////////////////////
            "elsys-ers2co2": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,//debugDefault, //["all"],
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    }
                },
                "bacnet": {
                    "offset": 2200,
                    "instanceRange": 10,
                    "objects": {
                        "co2": { "lorawanPayloadName": "co2", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "people": { "lorawanPayloadName": "motion", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "humidity": { "lorawanPayloadName": "humidity", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "uplink", "value": null },
                        "temperature": { "lorawanPayloadName": "temperature", "objectType": "analogValue", "instanceNum": 3, "dataDirection": "uplink", "value": null },
                        "batteryVoltage": { "lorawanPayloadName": "vdd", "objectType": "analogValue", "instanceNum": 4, "dataDirection": "uplink", "value": null },
                        "light": { "lorawanPayloadName": "light", "objectType": "analogValue", "instanceNum": 5, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // Thermostatic valve - MClimate Vicki
            /////////////////////////////////////////////////////////////////////////
            "mclimate-vicki": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": 1,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    },
                    "actility": {
                        "driver": {
                            "pId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "mId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "ver": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK"
                        }
                    }
                },
                "bacnet": {
                    "offset": 3000,
                    "instanceRange": 10,
                    "objects": {
                        "valveSetpoint": { "lorawanPayloadName": "targetTemperature", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "valveTemperature": { "lorawanPayloadName": "sensorTemperature", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "controllerSetpoint": { "lorawanPayloadName": "setTargetTemperature", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "downlink", "value": 21 },
                        "valvePosition": { "lorawanPayloadName": "valveOpenness", "objectType": "analogValue", "instanceNum": 3, "dataDirection": "uplink", "value": null },
                        "valveChildLock": { "lorawanPayloadName": "childLock", "objectType": "binaryValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "controllerChildLock": { "lorawanPayloadName": "setChildLock", "objectType": "binaryValue", "instanceNum": 1, "dataDirection": "downlink", "value": true },
                        "batteryVoltage": { "lorawanPayloadName": "batteryVoltage", "objectType": "analogValue", "instanceNum": 4, "dataDirection": "uplink", "value": null },
                        "openWindownDetection": { "lorawanPayloadName": "openWindow", "objectType": "binaryValue", "instanceNum": 2, "dataDirection": "uplink", "value": null },
                        "valveHumidity": { "lorawanPayloadName": "relativeHumidity", "objectType": "analogValue", "instanceNum": 5, "dataDirection": "uplink", "value": null },

                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // Thermostatic Valve - Milesight - wt101
            /////////////////////////////////////////////////////////////////////////
            "milesight-wt101": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": 85,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    },
                    "actility": {
                        "driver": {
                            "pId": "usmb",
                            "mId": "valve",
                            "ver": "1"
                        }
                    }
                },
                "bacnet": {
                    "offset": 4000,
                    "instanceRange": 10,
                    "objects": {
                        "valveSetpoint": { "lorawanPayloadName": "temperature_target", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "valveTemperature": { "lorawanPayloadName": "temperature", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "controllerSetpoint": { "lorawanPayloadName": "temperature_target", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "downlink", "value": 20 },
                        "controllerSetpointError": { "lorawanPayloadName": "temperature_error", "objectType": "analogValue", "instanceNum": 3, "dataDirection": "downlink", "value": 0.5 }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // Thermostatic valve - Micropelt MLR003
            /////////////////////////////////////////////////////////////////////////
            "micropelt-mlr003": {
                "identity": {},
                "controller": {
                    "debug": debugDefault,//["txTime"] , //debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": 1,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    },
                    "actility": {
                        "driver": {
                            "pId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "mId": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK",
                            "ver": "TO_CONFIGURE_IF_USING_ACTILITY_AND_DOWNLINK"
                        }
                    }
                },
                "bacnet": {
                    "offset": 5000,
                    "instanceRange": 10,
                    "objects": {
                        "valveSetpoint": { "lorawanPayloadName": "User_Value", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "valveTemperature": { "lorawanPayloadName": "Ambient_Temperature", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "controllerSetpoint": { "lorawanPayloadName": "controllerSetpoint", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "downlink", "value": 20 },
                        "userMode": { "lorawanPayloadName": "User_Mode", "objectType": "analogValue", "instanceNum": 3, "dataDirection": "uplink", "value": null },
                        "currentConsumed": { "lorawanPayloadName": "Average_Current_Consumed", "objectType": "analogValue", "instanceNum": 4, "dataDirection": "uplink", "value": null },
                        "currentGenerated": { "lorawanPayloadName": "Average_Current_Generated", "objectType": "analogValue", "instanceNum": 5, "dataDirection": "uplink", "value": null },
                        "valvePosition": { "lorawanPayloadName": "Current_Valve_Position", "objectType": "analogValue", "instanceNum": 6, "dataDirection": "uplink", "value": null },
                        "valveFlowTemperature": { "lorawanPayloadName": "Flow_Temperature", "objectType": "analogValue", "instanceNum": 7, "dataDirection": "uplink", "value": null },
                        "batteryVoltage": { "lorawanPayloadName": "Storage_Voltage", "objectType": "analogValue", "instanceNum": 8, "dataDirection": "uplink", "value": null },
                        "ackError": { "lorawanPayloadName": "Radio_Communication_Error", "objectType": "binaryValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // Current sensor - ATIM TCT e-green
            /////////////////////////////////////////////////////////////////////////
            "atim-egreen": {
                "identity": {},
                "controller": {
                    "debug": debugDefault, //debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    }
                },
                "bacnet": {
                    "offset": 6000,
                    "instanceRange": 5,
                    "objects": {
                        "batteryVoltage": { "lorawanPayloadName": "tension.value[0]", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "temperature": { "lorawanPayloadName": "temperature0.value[0]", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "current": { "lorawanPayloadName": "courant.value[0]", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            },

            //////////////////////////////////////////////////////////////////////////
            // Current sensor - MILESIGHT CT103
            /////////////////////////////////////////////////////////////////////////
            "milesight-ct103": {
                "identity": {},
                "controller": {
                    "debug": debugDefault, //debugDefault,
                    "model": "distechControlsV2",
                    "protocol": protocol,
                    "ipAddress": ipAddress,
                    "login": login,
                    "password": password,
                },
                "lorawan": {
                    "networkServer": networkServer,
                    "downlinkPort": null,
                    "flushDownlinkQueue": true,
                    "chirpstack": {
                        "grpcApikey": chirpstackGrpcApikey
                    }
                },
                "bacnet": {
                    "offset": 6100,
                    "instanceRange": 5,
                    "objects": {
                        "totalCurrent": { "lorawanPayloadName": "total_current", "objectType": "analogValue", "instanceNum": 0, "dataDirection": "uplink", "value": null },
                        "current": { "lorawanPayloadName": "current", "objectType": "analogValue", "instanceNum": 1, "dataDirection": "uplink", "value": null },
                        "temperature": { "lorawanPayloadName": "temperature", "objectType": "analogValue", "instanceNum": 2, "dataDirection": "uplink", "value": null }
                    }
                },
                "mqtt": {
                    "topicDownlink": {},
                }
            }

        }

        /////////////////////////////////////////////////
        /////////////   DO NOT MODIFY ///////////////////
        /////////////////////////////////////////////////

        const networkServerSupported = ["tts", "chirpstack", "actility"];
        const protocolSupported = ["restAPIBacnet", "bacnet"];


        node.on("input", function (msg) {
            console.log(ipAddress)
            console.log(networkServer)
            let context = node.context();
            let globalContext = context.global;

            // Store Global variables
            globalContext.set('g_deviceList', deviceList)
            globalContext.set('g_httpRequestTimeOut', 5000);
            globalContext.set('g_tts_topicDownlinkSuffix', "/down");
            globalContext.set('g_tts_topicUplinkSuffix', "/up");
            globalContext.set('g_chirp_topicDownlinkSuffix', "/command/down");
            globalContext.set('g_chirp_topicUplinkSuffix', "/event/up");
            globalContext.set('g_actility_topicDownlinkSuffix', "/downlink");
            globalContext.set('g_actility_topicUplinkSuffix', "/uplink");

            // Debug function
            const debug = function (device, debugType, debugText) {
                if (debugType == "forceOn") {
                    node.warn(debugText);
                }
                else if (device.controller.debug.some(element => element == "all" || element == debugType)) {
                    node.warn(debugText);
                }
                else {
                    return null;
                }
            }
            globalContext.set("g_debug", debug);

            // Controller HTTP Autentification key
            for (let device in deviceList) {
                const buffer = Buffer.from(deviceList[device].controller.login + ':' + deviceList[device].controller.password);
                deviceList[device].controller.httpAuthentication = "Basic " + buffer.toString('base64');
            }

            ////////////////////////////////
            // Check configuration settings
            ////////////////////////////////
            let objectInstanceArray = [];

            for (let device in deviceList) {

                // Check LoRaWAN Network Servers ["tts", "chirpstack", "actility"]
                if (!networkServerSupported.some(element => element == deviceList[device].lorawan.networkServer)) {
                    node.error("For device '" + device + "' : Network Server unknown - Choose between 'chirpstack', 'tts' or 'actility'");
                    node.status({ fill: "red", shape: "dot", text: "Network Server not supported" });
                    return null;
                }

                // Check that bacnetObject size is 5
                for (let object in deviceList[device].bacnet.objects) {
                    if (Object.keys(deviceList[device].bacnet.objects[object]).length != 5) {
                        node.error(`For device "${device}" : error in ${object}`);
                        node.status({ fill: "red", shape: "dot", text: "BACnet object Size error" });
                        return null;
                    }
                }

                // Check device.controller.protocol ["restAPIBacnet", "bacnet"]
                if (!protocolSupported.some(element => element == deviceList[device].controller.protocol)) {
                    node.error(`For device "${device}" : Protocol unknown - Choose between 'restAPIBacnet' or 'bacnet'`);
                    node.status({ fill: "red", shape: "dot", text: "Network Server not supported" });
                    return null;
                }

                // Check device.bacnet.instanceRange >= Number of BACnet object in the deviceList
                let instanceRangeAV = 0, instanceRangeBV = 0;

                for (let object in deviceList[device].bacnet.objects) {
                    if (deviceList[device].bacnet.objects[object].objectType == "analogValue") instanceRangeAV++;
                    if (deviceList[device].bacnet.objects[object].objectType == "binaryValue") instanceRangeBV++;
                }
                if (deviceList[device].bacnet.instanceRange < instanceRangeAV) {
                    node.error(`For device "${device}" : instanceRange too small for Analog Value`);
                    node.status({ fill: "red", shape: "dot", text: "instanceRange too small" });
                    return null;
                }
                if (deviceList[device].bacnet.instanceRange < instanceRangeBV) {
                    node.error(`For device "${device}" : instanceRange too small for Binary Value`);
                    node.status({ fill: "red", shape: "dot", text: "instanceRange too small" });
                    return null;
                }

                // Build an array with offset, instanceRange and device
                objectInstanceArray.push({ "device": device, "offset": deviceList[device].bacnet.offset, "instanceRange": deviceList[device].bacnet.instanceRange });
            }

            // Check that offset and instanceRange don't overlap and calcul maxDeviceNum for each type.
            objectInstanceArray.sort((a, b) => a.offset - b.offset);
            for (let i = 0; i < objectInstanceArray.length - 1; i++) {
                if (objectInstanceArray[i].offset + objectInstanceArray[i].instanceRange > objectInstanceArray[i + 1].offset) {
                    node.error(`BACnet objects of Device "${objectInstanceArray[i].device}" and "${objectInstanceArray[i + 1].device}" overlap`)
                    node.status({ fill: "red", shape: "dot", text: "BACnet objects instances overlap" });
                    return null;
                }
                else {
                    deviceList[objectInstanceArray[i].device].identity.maxDeviceNum = Math.trunc((objectInstanceArray[i + 1].offset - objectInstanceArray[i].offset) / objectInstanceArray[i].instanceRange) - 1;
                }
            }

            ////////////////////////////////////
            // Return if all checkings are clear
            ///////////////////////////////////
            node.status({ fill: "green", shape: "dot", text: "Configuration OK" });

            msg.payload = deviceList;
            node.send(msg)
        });
    }

    RED.nodes.registerType("device configuration", DeviceConfiguration);
};

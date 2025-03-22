module.exports = function (RED) {
    function DeviceConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.on("input", function (msg) {
            let deviceList = config.deviceList || {};

            // Device name to device format
            let tmpDeviceList = {};
            deviceList.forEach(element => {
                tmpDeviceList[element.deviceName] = { ...element };
                delete tmpDeviceList[element.deviceName].deviceName;
                // Change debug "none" to null
                if(tmpDeviceList[element.deviceName].controller.debug[0] === "none"){
                    tmpDeviceList[element.deviceName].controller.debug[0] = null;
                }
            });
            deviceList = tmpDeviceList;

            // Device objects array to json format
            Object.values(deviceList).forEach((device) => {
                let objectsArray = device.bacnet.objects;
                delete device.bacnet.objectsCount;
                device.bacnet.objects = {};
                for (let i = 0; i < objectsArray.length; i++) {
                    obj = objectsArray[i];
                    obj.instanceNum = i;
                    obj.lorawanPayloadName = obj.objectName;
                    delete obj.objectName;
                    device.bacnet.objects[obj.lorawanPayloadName] = obj;
                  }
            });
            
            // Remove logins and passwords if protocol is not restAPIBacnet
            // And add httpAuthentication if protocol is restAPIBacnet
            if(config.protocol === "restAPIBacnet") {
                for (let device in deviceList) {
                    const buffer = Buffer.from(deviceList[device].controller.login + ':' + deviceList[device].controller.password);
                    deviceList[device].controller.httpAuthentication = "Basic " + buffer.toString('base64');
                }
            } else {
                for (let device in deviceList) {
                    delete deviceList[device].controller.login;
                    delete deviceList[device].controller.password;
                }
            }

            // Remove actility key if networkServer is not actility
            if(config.networkServer !== "actility") {
                for (let device in deviceList) {
                    delete deviceList[device].lorawan.actility;
                }
            }

            // Remove chirpstack key if networkServer is not chirpstack
            if(config.networkServer !== "chirpstack") {
                for (let device in deviceList) {
                    delete deviceList[device].lorawan.chirpstack;
                }
            }

            msg.payload = deviceList;
            node.send(msg);
        });

    }

    RED.nodes.registerType("device-configuration", DeviceConfiguration);
};

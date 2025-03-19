module.exports = function (RED) {
    function DeviceConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        node.on("input", function (msg) {
            let newDeviceList = {};
            this.deviceList = config.deviceList || {};

            node.deviceList.forEach(element => {
                newDeviceList[element.deviceName] = { ...element };
                delete newDeviceList[element.deviceName].deviceName;
            });
            msg.payload = newDeviceList;
            node.send(msg);
        });

    }

    RED.nodes.registerType("device configuration", DeviceConfiguration);
};

module.exports = function (RED) {
    function DeviceConfiguration(config) {
        RED.nodes.createNode(this, config);
        this.list = config.list || [];

        var node = this;

        node.on("input", function (msg) {
            msg.payload = node.list.map(device => ({
                name: device.name || "Unknown",
            }));
            node.send(msg);
        });
    }

    RED.nodes.registerType("device configuration", DeviceConfiguration);
};

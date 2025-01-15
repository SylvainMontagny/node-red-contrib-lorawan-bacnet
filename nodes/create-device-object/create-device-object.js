const tools = require('../shared/tools.js');

module.exports = function(RED) {
    function CreateDeviceObject(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        const nodeID = "ed250713f81379b7"
        const nodeData = tools.findNode(nodeID)
        if (!nodeData || !nodeData.func) {
            node.error("No valid node found for the given ID");
            return;
        }
        let nodeFunction;
        try {
            nodeFunction = new Function('msg', 'node', 'global', nodeData["func"]);
        } catch (err) {
            node.error("Failed to create dynamic function: " + err.message);
            return;
        }

        node.on('input', function(msg) {
            try {
                const result = nodeFunction(msg, node, node.context().global);
                node.send(result);
            } catch (err) {
                node.error("Error on Create Device Object: " + err.message, msg);
            }
        });
    }

    RED.nodes.registerType("create device object", CreateDeviceObject);
}

const tools = require("../shared/tools.js");

module.exports = function (RED) {
  function DeviceConfiguration(config) {
    RED.nodes.createNode(this, config);
    this.ipAddress = config.ipAddress;
    var node = this;
    const nodeID = "54083d75c4d5d076";
    const nodeData = tools.findNode(nodeID);
    if (!nodeData || !nodeData.func) {
      node.error("No valid node found for the given ID");
      return;
    }
    let nodeFunction;
    try {
        let functionBody = nodeData["func"].replace(
            'const ipAddress = "TO_CONFIGURE";',
            `const ipAddress = "${this.ipAddress}";`
        );
        nodeFunction = new Function("msg", "node", "global", functionBody);
    } catch (err) {
        node.error("Failed to create dynamic function: " + err.message);
        return;
    }

    node.on("input", function (msg) {
      try {
        const result = nodeFunction(msg, node, node.context().global);
        node.send(result);
      } catch (err) {
        node.error("Error on Device Configuration: " + err.message, msg);
      }
    });
  }

  RED.nodes.registerType("device configuration", DeviceConfiguration);
};

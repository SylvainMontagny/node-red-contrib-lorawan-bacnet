module.exports = function (RED) {
    function LoRaBACConfiguration(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        setupStatus(this);
        setupGlobalVariables(this);

        node.on("input", function (msg) {
            let deviceList = config.deviceList || {};

            if(config.globalConfig.protocol === "restAPIBacnet"){
                generateHttpAuthentication(deviceList);
            }
            
            msg.payload = deviceList;
            node.send(msg);
        });

    }

    function generateHttpAuthentication(deviceList){
        for (let device in deviceList) {
            const buffer = Buffer.from(deviceList[device].controller.login + ':' + deviceList[device].controller.password);
            deviceList[device].controller.httpAuthentication = "Basic " + buffer.toString('base64');
        }
    }

    function setupStatus(node){
        node.status({fill:"green",shape:"dot",text:"Configuration OK"});
    }

    function setupGlobalVariables(node){
        const global = node.context().global;

        global.set('g_deviceList', node.deviceList);
        global.set('g_httpRequestTimeOut', 5000);
        global.set('g_tts_topicDownlinkSuffix', "/down");
        global.set('g_tts_topicUplinkSuffix', "/up");
        global.set('g_chirp_topicDownlinkSuffix', "/command/down");
        global.set('g_chirp_topicUplinkSuffix', "/event/up");
        global.set('g_actility_topicDownlinkSuffix', "/downlink");
        global.set('g_actility_topicUplinkSuffix', "/uplink");
    }

    RED.nodes.registerType("LoRaBAC configuration", LoRaBACConfiguration);
};

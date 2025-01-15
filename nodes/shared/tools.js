const flow = require('./LoRaBAC.json');

module.exports = {
    findNode: function(id) {
        const node = flow.find(item => item.id === id);
        return node;
    },
};
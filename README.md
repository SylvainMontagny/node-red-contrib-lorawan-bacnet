# node-red-contrib-lorawan-bacnet

This Node-RED module provides custom nodes for integrating LoRaWAN devices with BACnet systems. It simplifies the process of connecting IoT devices using LoRaWAN to building automation systems that use the BACnet protocol.

## Features

- **LoRaBAC Create Object Node**: Processes LoRaWAN messages and creates BACnet-compatible device objects.
- **LoRaBAC Configuration Node**: Provides a graphical interface for configuring devices and their BACnet objects.

## Nodes

### 1. LoRaBAC Create Object Node

The **LoRaBAC Create Object Node** is responsible for:
- Parsing incoming LoRaWAN messages from network servers (e.g., TTS, Chirpstack, Actility).
- Extracting and validating device information.
- Creating structured BACnet-compatible device objects.
- Handling payload decoding to ensure compatibility with BACnet protocols.


---

### 2. LoRaBAC Configuration Node

The **LoRaBAC Configuration Node** provides a user-friendly interface for:
- Configuring devices and their associated BACnet objects.
- Managing device lists and creating new BACnet objects.
- Supporting multiple network servers and protocols, including REST API BACnet and native BACnet.
- Allowing protocol-specific configurations, such as Actility driver settings.

---

## Installation

You can install this module via npm or through the Node-RED interface.

### Install via npm
Run the following command in your Node-RED user directory (typically `~/.node-red`):
```bash
npm install @montagny/node-red-contrib-lorawan-bacnet
```

### Install via Node-RED Interface
1. Open the Node-RED interface ([http://localhost:1880](http://localhost:1880)).
2. Go to the "Manage Palette" menu.
3. Search for `@montagny/node-red-contrib-lorawan-bacnet` in the "Install" tab.
4. Click "Install" to add the module to your Node-RED instance.

---

## License

This project is licensed under the MIT. See the [LICENSE](./LICENSE) file for details.

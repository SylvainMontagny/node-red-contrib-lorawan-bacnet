# node-red-contrib-lorawan-bacnet

This Node-RED module provides a custom node and an example flow to integrate LoRaWAN devices with BACnet systems. It simplifies the process of connecting IoT devices using LoRaWAN to building automation systems that use the BACnet protocol.

## Features

- **Unified LoRaBAC Node**: Handles both device configuration and BACnet object creation in one powerful node.
- **Built-in Flow Example**: A preconfigured flow is included to help you get started quickly and ensure proper integration.
- **LoRaWAN and BACnet Integration**: Supports multiple network servers (TTS, Chirpstack, Actility) and BACnet protocols (REST API and native).
- **Dynamic Configuration Interface**: Easily manage devices and BACnet objects through a graphical configuration UI.

---

## Node

### LoRaBAC Node

The **LoRaBAC Node** is responsible for:
- Parsing and decoding incoming LoRaWAN messages from supported network servers.
- Providing a graphical interface to configure devices and their BACnet objects.
- Validating configurations and ensuring proper mapping to BACnet object types.
- Managing device lists dynamically and supporting both manual and automatic instance assignment.
- Supporting protocol-specific configurations such as Actility driver settings and DistechControls models.

This node replaces the previous split between "Create Object" and "Configuration" nodes by merging both capabilities into a single, user-friendly component.

---

## Installation

You can install this module via npm or through the Node-RED interface.

### Install via npm
Run the following command in your Node-RED user directory (typically ~/.node-red):
bash
npm install @montagny/node-red-contrib-lorawan-bacnet


### Install via Node-RED Interface
1. Open the Node-RED interface ([http://localhost:1880](http://localhost:1880)).
2. Go to the "Manage Palette" menu.
3. Search for @montagny/node-red-contrib-lorawan-bacnet in the "Install" tab.
4. Click "Install" to add the module to your Node-RED instance.

---

## Example Flow

This module includes a complete **example flow** to demonstrate how to:
- Configure LoRaWAN devices and their BACnet mappings.
- Connect the LoRaBAC node to real or simulated input data.
- Ensure correct data routing between network servers and BACnet-compatible systems.

### How to import the example:

1. After installing the module, go to the Node-RED editor.
2. Click the menu (☰) → "Import" → "Examples" → `@montagny/node-red-contrib-lorawan-bacnet` → **LoRaBAC**.
3. Deploy the flow and start testing your integration.

This flow provides the recommended structure for using the LoRaBAC node effectively.

---

## License

This project is licensed under the MIT. See the [LICENSE](./LICENSE) file for details.
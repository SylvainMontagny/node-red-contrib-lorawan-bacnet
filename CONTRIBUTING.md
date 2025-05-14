# Contributing to node-red-contrib-lorawan-bacnet

## Prerequisites

- Docker installed and running
- Git installed
- Terminal access with necessary permissions

## Clone the Repository

Start by cloning the repository locally:

```bash
git clone https://github.com/SylvainMontagny/node-red-contrib-lorawan-bacnet.git
cd node-red-contrib-lorawan-bacnet
```

## Run the Docker Container with the Code Mounted as a Volume

Use the `montagny/node-red` image to start a container with your local code mounted:

```bash
docker run -d \
  --name node-red-lorawan-bacnet \
  -p 1880:1880 \
  -v $(pwd):/data/node-red-contrib-lorawan-bacnet \
  -u root \
  montagny/node-red
```

> Replace `$(pwd)` with the full path if you’re not running the command from the project directory.

## Link the Palette Locally with `npm link`

Once the container is running, open a shell inside:

```bash
docker exec -it node-red-lorawan-bacnet bash
```

Inside the container, run the following:

```bash
npm uninstall @montagny/node-red-contrib-lorawan-bacnet
npm link /data/node-red-contrib-lorawan-bacnet
```

This allows Node-RED to use the development version of the palette directly from the mounted volume.

## Restart Node-RED

Restart the container from the host machine:

```bash
docker restart node-red-lorawan-bacnet
```

## Testing

Once linked, open the Node-RED editor in your browser:

[http://localhost:1880](http://localhost:1880)

You can now test your changes directly from the editor, you have to restart container to apply changes.

# Teve-o-mata

An application that automatically feeds and teaches your camels on [Teveclub.hu](http://teveclub.hu) and sends [Ntfy.sh](https://ntfy.sh) notifications about it.

## Configuration

Create a `.env` file based on the following template:

```dotenv
NTFY_URL=
LOGIN=
PASSWORD=
```

## Running the application

```bash
docker run \
  --detach \
  --env-file .env \
  --restart unless-stopped \
  --name teve-o-mata \
  ghcr.io/lpgera/teve-o-mata
```

It will trigger on start and then once every day while the application is running.

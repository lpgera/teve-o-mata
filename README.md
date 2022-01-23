# Teve-o-mata

An application that automatically feeds and teaches your camels on Teveclub.hu (http://teveclub.hu) and sends Pushbullet (https://www.pushbullet.com) notes about it.

## Configuration

Create a `.env` file based on the following template:

```dotenv
PUSHBULLET_API_KEY=
LOGIN=
PASSWORD=
```

You can get a Pushbullet access token on your account settings page: https://www.pushbullet.com/#settings/account

## Running the application

```bash
docker run \
  --detach \
  --env-file .env \
  --restart unless-stopped \
  --name teve-o-mata \
  ghcr.io/lpgera/teve-o-mata:master
```

It will trigger on start and then once every day while the application is running.

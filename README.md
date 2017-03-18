# Teve-o-mata

An application that automatically feeds and teaches your camels on Teveclub.hu (http://teveclub.hu) and sends Pushbullet (https://www.pushbullet.com) notes about it.

## Configuration

Edit your production.json5 file according to the example below.

```json5
{
  pushbullet: {
    apiKey: "<YOUR_PUSHBULLET_ACCESS_TOKEN>",
  },
  teveclub: [
    {
      login: "<LOGIN>",
      password: "<PASSWORD>",
    },
  ],
}
```

You can get a Pushbullet access token on your account settings page: https://www.pushbullet.com/#settings/account

## Running the application

```sh
npm install
npm run prod
```

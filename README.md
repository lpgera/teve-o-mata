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

You may create a cron job to run the application every day:

```
0 10 * * * cd /usr/local/teve-o-mata && npm run prod > /dev/null 2>&1
```

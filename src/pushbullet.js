module.exports = async (message) => {
  const response = await fetch('https://api.pushbullet.com/v2/pushes', {
    method: 'POST',
    headers: {
      'Access-Token': process.env.PUSHBULLET_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'note',
      title: 'Teve-o-mata',
      body: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`PushBullet API request failed: ${response.status} ${response.statusText} ${
      JSON.stringify(await response.json(), null, 2)
    }`)
  }
}

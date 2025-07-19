export default async (message: string) => {
  const response = await fetch(process.env.NTFY_URL, {
    method: 'POST',
    headers: {
      Title: 'Teve-o-mata',
      Tag: 'dromedary_camel',
    },
    body: message,
  })

  if (!response.ok) {
    throw new Error(`Ntfy.sh request failed: ${response.status} ${response.statusText} ${
      JSON.stringify(await response.json(), null, 2)
    }`)
  }
}

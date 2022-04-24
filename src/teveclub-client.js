const iconv = require('iconv-lite')
const querystring = require('querystring')
const qsIconv = require('qs-iconv')

module.exports = () => {
  const baseUrl = 'https://teveclub.hu'
  const headers = {
    Origin: baseUrl,
    Referer: baseUrl,
    'User-agent': 'Mozilla/5.0 (Linux; Android 12; NE2213) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/100.0.4896.127 Mobile Safari/537.36',
  }
  let sessionCookie = null

  const url = (path) => new URL(path, baseUrl).toString()

  const formData = (object) => querystring.stringify(object, null, null, {encodeURIComponent: qsIconv.encoder('CP1252')})

  const login = async ({ tevenev, pass }) => {
    const response = await fetch(url('/'), {
      method: 'POST',
      redirect: 'manual',
      headers: {
        ...headers,
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: formData({
        tevenev,
        pass,
        x: '34',
        y: '33',
        login: 'Gyere!',
      }),
    })

    if (!/myteve\.pet/.test(response.headers.get('Location'))) {
      throw new Error('Login was unsuccessful')
    }

    const [,match] = response.headers.get('Set-cookie').match(/(SESSION_ID=.*);/)
    if (!match) {
      throw new Error('Could not retrieve session ID')
    }
    sessionCookie = match

    const responseBuffer = Buffer.from(await response.arrayBuffer())

    return iconv.decode(responseBuffer, 'CP1252')
  }

  const get = async ({ path }) => {
    const response = await fetch(url(path), {
      method: 'GET',
      headers: {
        ...headers,
        Cookie: sessionCookie,
      },
    })

    if (!response.ok) {
      throw new Error(`GET ${url(path)} failed: ${response.status} ${response.statusText}`)
    }

    const responseBuffer = Buffer.from(await response.arrayBuffer())

    return iconv.decode(responseBuffer, 'CP1252')
  }

  const post = async ({ path, data }) => {
    const response = await fetch(url(path), {
      method: 'POST',
      headers: {
        ...headers,
        Cookie: sessionCookie,
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: formData(data),
    })

    if (!response.ok) {
      throw new Error(`POST ${url(path)} failed: ${response.status} ${response.statusText}`)
    }

    const responseBuffer = Buffer.from(await response.arrayBuffer())

    return iconv.decode(responseBuffer, 'CP1252')
  }

  return {
    login,
    get,
    post,
  }
}

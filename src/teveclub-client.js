const baseUrl = 'https://teveclub.hu'
const headers = {
  Origin: baseUrl,
  Referer: baseUrl,
}

const decoder = new TextDecoder('iso-8859-1')

const encodeObjectToIso8859FormData = object => {
  const encodeIso8859 = string => {
    const result = []
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i)
      if (char < 128) {
        if (char === 32) { // space
          result.push('+')
        } else if ((char >= 48 && char <= 57) || // 0-9
          (char >= 65 && char <= 90) || // A-Z
          (char >= 97 && char <= 122) || // a-z
          char === 45 || char === 46 || char === 95 || char === 126) { // -._~
          result.push(String.fromCharCode(char))
        } else {
          result.push('%' + char.toString(16).toUpperCase().padStart(2, '0'))
        }
      } else if (char <= 255) {
        result.push('%' + char.toString(16).toUpperCase().padStart(2, '0'))
      } else {
        throw new Error(`Character out of iso-8859-1 range: ${char}`)
      }
    }
    return result.join('')
  }

  return Object.entries(object)
    .map(([key, value]) => `${encodeIso8859(key)}=${encodeIso8859(value)}`)
    .join('&')
}

const url = path => new URL(path, baseUrl).toString()

export default () => {
  let sessionCookie = null

  const login = async ({ tevenev, pass }) => {
    const response = await fetch(url('/'), {
      method: 'POST',
      redirect: 'manual',
      headers: {
        ...headers,
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: encodeObjectToIso8859FormData({
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

    const [, match] = response.headers.get('Set-cookie').match(/(SESSION_ID=.*);/)
    if (!match) {
      throw new Error('Could not retrieve session ID')
    }
    sessionCookie = match

    return decoder.decode(await response.arrayBuffer())
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

    return decoder.decode(await response.arrayBuffer())
  }

  const post = async ({ path, data }) => {
    const response = await fetch(url(path), {
      method: 'POST',
      headers: {
        ...headers,
        Cookie: sessionCookie,
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: encodeObjectToIso8859FormData(data),
    })

    if (!response.ok) {
      throw new Error(`POST ${url(path)} failed: ${response.status} ${response.statusText}`)
    }

    return decoder.decode(await response.arrayBuffer())
  }

  return {
    login,
    get,
    post,
  }
}

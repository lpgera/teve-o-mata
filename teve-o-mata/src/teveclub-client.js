const _ = require('lodash')
const request = require('request')
const Promise = require('bluebird')
const encoder = require('qs-iconv/encoder')
const iconv = require('iconv-lite')
const log = require('./log')

class TeveclubRestClient {

  constructor() {
    this.requestWithConfiguration = Promise.promisifyAll(request.defaults({
      jar: true,
      baseUrl: 'http://teveclub.hu',
      userQuerystring: false,
      qsStringifyOptions: { encoder: encoder('CP1252') },
      followAllRedirects: true,
      forever: true,
      headers: {
        Origin: 'http://teveclub.hu',
        Referer: 'http://teveclub.hu',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
      },
      encoding: null,
    }), {multiArgs: true})
  }

  handleHttpErrorCodes(response, body, options, method, path) {
    log.debug(`Received statusCode ${response.statusCode} while invoking ${method} ${path}`)
    if (response.statusCode >= 400 && !_.get(options, 'ignoreHttpErrors', false)) {
      const message = `Received status code ${response.statusCode} while invoking ${method} ${this.baseUrl}${path}.` +
      ` Response body: ${JSON.stringify(body, null, 2)}.`
      log.error(message)
      return Promise.reject(new Error(message, response.statusCode))
    }
    return [response, body]
  }

  logTimeoutFunction(path) {
    return (err) => {
      if (err.code === 'ETIMEDOUT') {
        log.error(`Connection timed out. URL: ${this.baseUrl}${path}`)
      }
      if (err.code === 'ESOCKETTIMEDOUT') {
        log.error(`Socket timed out. URL: ${this.baseUrl}${path}`)
      }
      throw err
    }
  }

  getAsync(path, options) {
    return this.requestWithConfiguration.getAsync(encodeURI(path), options)
      .spread((response, body) => {
        const bodyDecoded = iconv.decode(body, 'CP1252')
        return this.handleHttpErrorCodes(response, bodyDecoded, options, 'GET', path)
      })
      .catch(this.logTimeoutFunction(path))
  }

  postAsync(path, options) {
    return this.requestWithConfiguration.postAsync(encodeURI(path), options)
      .spread((response, body) => {
        const bodyDecoded = iconv.decode(body, 'CP1252')
        return this.handleHttpErrorCodes(response, bodyDecoded, options, 'POST', path)
      })
      .catch(this.logTimeoutFunction(path))
  }

}

module.exports = TeveclubRestClient

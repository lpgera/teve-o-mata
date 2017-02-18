const _ = require('lodash')
const Promise = require('bluebird')
const Pushbullet = require('pushbullet')
const config = require('config')
const cheerio = require('cheerio')
const log = require('./log')
const TeveclubRestClient = require('./teveclub-client')

const pusher = Promise.promisifyAll(new Pushbullet(config.get('pushbullet.apiKey')))

const teveList = config.get('teveclub')

_.map(teveList, (teve) => {
  const teveclubRestClient = new TeveclubRestClient()

  return teveclubRestClient.getAsync('/')
    .then(() => {
      return teveclubRestClient.postAsync('/', {
        form: {
          tevenev: teve.login,
          pass: teve.password,
          x: '34',
          y: '33',
          login: 'Gyere!',
        },
      })
    })
    .then(() => {
      return teveclubRestClient.postAsync('/myteve.pet', {
        form: {
          kaja: 1,
          pia: 1,
          etet: 'Mehet!',
        },
      })
    })
    .then(() => {
      return teveclubRestClient.getAsync('/tanit.pet')
    })
    .spread((response, body) => {
      const $ = cheerio.load(body)
      if ($('select').length > 2) {
        return pusher.noteAsync(null, 'Teve-o-mata', `Válassz új trükköt ${teve.login} tevédnek!`)
      }
      return teveclubRestClient.postAsync('/tanit.pet', {
        form: {
          farmdoit: 'tanit',
          learn: 'Tanulj teve!',
        },
      })
    })
    .then(() => {
      return pusher.noteAsync(null, 'Teve-o-mata', `${teve.login} tanítva és megetetve!`)
    })
    .catch((err) => {
      log.error(err)
      return pusher.noteAsync(null, 'Teve-o-mata', err)
    })
})

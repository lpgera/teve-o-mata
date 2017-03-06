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

  return teveclubRestClient.getAsync('/').then(() => {
    return teveclubRestClient.postAsync('/', {
      form: {
        tevenev: teve.login,
        pass: teve.password,
        x: '34',
        y: '33',
        login: 'Gyere!',
      },
    })
  }).then(() => {
    return teveclubRestClient.postAsync('/myteve.pet', {
      form: {
        kaja: 1,
        pia: 1,
        etet: 'Mehet!',
      },
    })
  }).then(() => {
    return teveclubRestClient.getAsync('/tanit.pet')
  }).spread((response, body) => {
    const $ = cheerio.load(body)
    if ($('select').length > 2) {
      return false
    }
    return teveclubRestClient.postAsync('/tanit.pet', {
      form: {
        farmdoit: 'tanit',
        learn: 'Tanulj teve!',
      },
    }).then(() => {
      return true
    })
  }).then((tanitva) => {
    if (tanitva) {
      return teveclubRestClient.getAsync('/tanit.pet').spread((response, body) => {
        const $ = cheerio.load(body)
        const leckekRawText = $('tr:nth-child(1) > td > font > b > div').text()
        const leckekMatches = leckekRawText.match(new RegExp('(\\d+)[^\\d]+Ebb.l tev.d m.r[^\\d]+(\\d+)'))
        const osszesLecke = _.get(leckekMatches, 1)
        const megtanultLecke = _.get(leckekMatches, 2)
        const trukk = $('tr:nth-child(1) > td > font > b > div > span:nth-child(2)').text()
        const tanulasProgressInfo = (() => {
          if (megtanultLecke && osszesLecke) {
            return ` (${trukk}: ${megtanultLecke}/${osszesLecke})`
          }
          return ''
        })()
        return pusher.noteAsync(null, 'Teve-o-mata', `${teve.login} megetetve és tanítva.${tanulasProgressInfo}`)
      })
    }
    return pusher.noteAsync(null, 'Teve-o-mata', `${teve.login} megetetve. Válassz új trükköt neki!`)
  }).catch((err) => {
    log.error(err)
    return pusher.noteAsync(null, 'Teve-o-mata', err)
  })
})

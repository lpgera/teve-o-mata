const _ = require('lodash')
const Promise = require('bluebird')
const Pushbullet = require('pushbullet')
const config = require('config')
const cheerio = require('cheerio')
const log = require('./log')
const TeveclubRestClient = require('./teveclub-client')

const pusher = Promise.promisifyAll(new Pushbullet(config.get('pushbullet.apiKey')))
const teveList = config.get('teveclub')

function initSession(teveclubRestClient) {
  return teveclubRestClient.getAsync('/')
}

function login(teveclubRestClient, teve) {
  return teveclubRestClient.postAsync('/', {
    form: {
      tevenev: teve.login,
      pass: teve.password,
      x: '34',
      y: '33',
      login: 'Gyere!',
    },
  })
}

function feed(teveclubRestClient) {
  return teveclubRestClient.postAsync('/myteve.pet', {
    form: {
      kaja: 1,
      pia: 1,
      etet: 'Mehet!',
    },
  })
}

function teach(teveclubRestClient) {
  return teveclubRestClient.getAsync('/tanit.pet').spread((response, body) => {
    const $ = cheerio.load(body)
    if ($('select[name="tudomany"]').length) { // select new trick to learn
      const tricks = $('select[name="tudomany"] option').map((index, element) => {
        const [, lessons] = $(element).text().match(/\((\d+) lecke \)/)
        return {
          value: $(element).prop('value'),
          lessons: _.toInteger(lessons),
        }
      }).get()
      const trickWithMinimumLessons = _.minBy(tricks, 'lessons')
      return teveclubRestClient.postAsync('/tanit.pet', {
        form: {
          tudomany: _.get(trickWithMinimumLessons, 'value'),
          learn: 'Tanulj teve!',
        },
      })
    }
    // continue learning the trick
    return teveclubRestClient.postAsync('/tanit.pet', {
      form: {
        farmdoit: 'tanit',
        learn: 'Tanulj teve!',
      },
    })
  })
}

function pushTeachingInfo(teveclubRestClient, teve) {
  return teveclubRestClient.getAsync('/tanit.pet').spread((response, body) => {
    const $ = cheerio.load(body)
    const teachingInfoText = $('tr:nth-child(1) > td > font > b > div').text()
    const teachingInfoMatches = teachingInfoText.match(/(\d+)[^\d]+Ebb.l tev.d m.r[^\d]+(\d+)/)
    const teachingProgressText = (() => {
      const [, allLessons, knownLessons] = teachingInfoMatches || []
      if (allLessons && knownLessons) {
        const trickText = $('tr:nth-child(1) > td > font > b > div > span:nth-child(2)').text()
        return `(${trickText}: ${knownLessons}/${allLessons})`
      }
      return 'Holnap új trükköt tanulhat!'
    })()
    return pusher.noteAsync(null, 'Teve-o-mata', `${teve.login} megetetve és tanítva. ${teachingProgressText}`)
  })
}

function handleError(err) {
  log.error(err)
  return pusher.noteAsync(null, 'Teve-o-mata', err)
}

return Promise.map(teveList, (teve) => {
  const teveclubRestClient = new TeveclubRestClient()

  return initSession(teveclubRestClient).then(() => {
    return login(teveclubRestClient, teve)
  }).then(() => {
    return feed(teveclubRestClient)
  }).then(() => {
    return teach(teveclubRestClient)
  }).then(() => {
    return pushTeachingInfo(teveclubRestClient, teve)
  })
}).catch(handleError)

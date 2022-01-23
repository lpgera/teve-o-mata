require('dotenv').config()

const _ = require('lodash')
const Promise = require('bluebird')
const Pushbullet = require('pushbullet')
const cheerio = require('cheerio')
const TeveclubRestClient = require('./teveclub-client')
const CronJob = require('cron').CronJob

const pusher = Promise.promisifyAll(new Pushbullet(process.env.PUSHBULLET_API_KEY))
if (!process.env.LOGIN) {
  throw new Error('process.env.LOGIN is undefined')
}
if (!process.env.PASSWORD) {
  throw new Error('process.env.PASSWORD is undefined')
}

function initSession(teveclubRestClient) {
  return teveclubRestClient.getAsync('/')
}

function login(teveclubRestClient) {
  return teveclubRestClient.postAsync('/', {
    form: {
      tevenev: process.env.LOGIN,
      pass: process.env.PASSWORD,
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

function play(teveclubRestClient) {
  return teveclubRestClient.postAsync('/egyszam.pet', {
    form: {
      honnan: Math.floor(Math.random() * 500) + 1,
      tipp: 'Ez a tippem!',
    },
  })
}

function pushTeachingInfo(teveclubRestClient) {
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
    return pusher.noteAsync(null, 'Teve-o-mata', `${process.env.LOGIN} megetetve és tanítva. ${teachingProgressText}`)
  })
}

function handleError(err) {
  console.error(err)
  return pusher.noteAsync(null, 'Teve-o-mata', _.toString(err))
}

function run() {
  const teveclubRestClient = new TeveclubRestClient()

  return initSession(teveclubRestClient).then(() => {
    return login(teveclubRestClient)
  }).then(() => {
    return feed(teveclubRestClient)
  }).then(() => {
    return teach(teveclubRestClient)
  }).then(() => {
    return play(teveclubRestClient)
  }).then(() => {
    return pushTeachingInfo(teveclubRestClient)
  }).catch(handleError)
}

const runOnInit = true
const start = true

const job = new CronJob(process.env.CRON_CONFIG || '0 0 5 * * *', run, null, start, null, null, runOnInit)

process.on('SIGINT', () => {
  job.stop()
})

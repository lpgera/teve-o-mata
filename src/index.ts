import * as cheerio from 'cheerio'
import { CronJob } from 'cron'
import ntfy from './ntfy.ts'
import TeveclubClient from './teveclub-client.ts'

type TeveclubClientType = ReturnType<typeof TeveclubClient>

if (!process.env.NTFY_URL) {
  throw new Error('process.env.NTFY_URL is undefined')
}
if (!process.env.LOGIN) {
  throw new Error('process.env.LOGIN is undefined')
}
if (!process.env.PASSWORD) {
  throw new Error('process.env.PASSWORD is undefined')
}

async function feed(teveclubClient: TeveclubClientType) {
  await teveclubClient.post({
    path: '/myteve.pet',
    data: {
      kaja: '1',
      pia: '1',
      etet: 'Mehet!',
    },
  })
}

async function teach(teveclubClient: TeveclubClientType) {
  const body = await teveclubClient.get({ path: '/tanit.pet' })

  const $ = cheerio.load(body)
  if ($('select[name="tudomany"]').length) {
    // select new trick to learn
    const tricks = $('select[name="tudomany"] option').map((index, element) => {
      const [, lessons] = $(element).text().match(/\((\d+) lecke \)/)
      return {
        value: $(element).prop('value'),
        lessons: Number(lessons ?? Number.MAX_SAFE_INTEGER),
      }
    }).get()
    const trickWithMinimumLessons = tricks.reduce((a, b) =>
      a.lessons <= b.lessons ? a : b, tricks[0]
    )
    await teveclubClient.post({
      path: '/tanit.pet',
      data: {
        tudomany: trickWithMinimumLessons.value,
        learn: 'Tanulj teve!',
      },
    })
  } else {
    // continue learning the trick
    await teveclubClient.post({
      path: '/tanit.pet',
      data: {
        farmdoit: 'tanit',
        learn: 'Tanulj teve!',
      },
    })
  }
}

async function play(teveclubClient: TeveclubClientType) {
  await teveclubClient.post({
    path: '/egyszam.pet',
    data: {
      honnan: String(Math.floor(Math.random() * 200) + 1),
      tipp: 'Ez a tippem!',
    },
  })
}

async function pushTeachingInfo(teveclubClient: TeveclubClientType) {
  const body = await teveclubClient.get({ path: '/tanit.pet' })

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

  await ntfy(`${process.env.LOGIN} megetetve és tanítva. ${teachingProgressText}`)
}

async function run() {
  try {
    const teveclubClient = TeveclubClient()
    await teveclubClient.login({
      tevenev: process.env.LOGIN,
      pass: process.env.PASSWORD,
    })
    await feed(teveclubClient)
    await teach(teveclubClient)
    await play(teveclubClient)
    await pushTeachingInfo(teveclubClient)
  } catch (error) {
    console.error(error)
    await ntfy(error.stack)
  }
}

const runOnInit = true
const start = true

const job = new CronJob(process.env.CRON_CONFIG || '0 0 5 * * *', run, null, start, null, null, runOnInit)

const exitHandler = async (signal: NodeJS.Signals) => {
  console.log(`Received ${signal}, exiting...`)
  job.stop()
}
process.on('SIGINT', exitHandler)
process.on('SIGTERM', exitHandler)

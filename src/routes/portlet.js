import express from 'express'
import axios from 'axios/index'
import log from '../logger'
const router = express.Router()

var portletSources = null
router.get('/', (req, res, next) => {
  res.send(req.PORTLETS)
})

router.get('/sources', async (req, res, next) => {
  portletSources = await getPortletSources(req.SOURCES)
  // if (!portletSources) {
  //   portletSources = await getPortletSources()
  // }
  res.send(portletSources)
  res.end()
})

router.get('/:id/', (req, res, next) => {
  res.send(req.PORTLETS[req.params.id])
})

async function getPortletSources (sources) {
  return new Promise(async (resolve, reject) => {
    let results = ''
    for (let i = 0; i < (sources || []).length; i++) {
      try {
        log.info('Getting remote source: ' + sources[i])
        let portletSource = await axios({
          method: 'get',
          url: sources[i],
          timeout: 3000
        })
        results += portletSource.data
      } catch (err) {
        log.error('Cannot load sources from ' + sources[i] + ' (' + err.message + ')')
        results += 'console.warn("Server error: cannot load sources from: ' + sources[i] + '");'
      }
    }
    log.info('Available sources loaded')
    resolve(results)
  })
}

export default router

import express from 'express'
import config from 'config'
import axios from 'axios/index'
import log from '../logger'
const router = express.Router();

var portletSources = null
router.get('/', (req, res, next) => {
  //res.send(config.portlets || []);
  res.send(config.portlets)
})

router.get('/sources', async (req, res, next) => {
  portletSources = await getPortletSources()
  // if (!portletSources) {
  //   portletSources = await getPortletSources()
  // }
  res.send(portletSources)
  res.end()
})

router.get('/:id/', (req, res, next) => {
  res.send(config.portlets[req.params.id]);
})

async function getPortletSources() {
  return new Promise(async (resolve, reject) => {
    let results = '';
    for (let i = 0; i < (config.sources || []).length; i++) {
      try {
        log.info('Getting remote source: ' + config.sources[i]);
        let portletSource = await axios({
          method: 'get',
          url: config.sources[i],
          timeout: 3000
        });
        results += portletSource.data
      } catch (err) {
        log.error('Cannot load sources from ' + config.sources[i] + ' (' + err.message + ')')
        results += 'console.warn("Server error: cannot load sources from: ' + config.sources[i] + '");';
      }
    }
    log.info('Available sources loaded')
    resolve(results)
  })
}

export default router



import express from 'express'
import config from 'config'
import axios from 'axios/index'
import log from '../logger'
const router = express.Router();

var portletMap = buildPortletMap();
var portletSources = null
router.get('/', (req, res, next) => {
  //res.send(config.portlets || []);
  res.send(portletMap)
})

router.get('/sources', async (req, res, next) => {
  portletSources = await getPortletSources()
  portletMap = buildPortletMap()
  if (!portletSources) {
    portletSources = await getPortletSources()
    portletMap = buildPortletMap()
  }
  res.send(portletSources)
  res.end()
})

router.get('/sources/rebuild', async (req, res, next) => {
  portletSources = await getPortletSources()
  portletMap = buildPortletMap()
  res.send('Done')
  res.end()
})

router.get('/:id/', (req, res, next) => {
  res.send(portletMap[req.params.id]);
})

router.get('/:id/source', async (req, res, next) => {
  var sourceLocation = portletMap[req.params.id]['source']
  if (sourceLocation) {
    log.info('Getting remote source: ' + sourceLocation);
    try {
      let portletSource = await axios.get(sourceLocation);
      res.set('Content-Type', 'text/html')
      res.attachment('src.js')
      // res.send()
      res.send(portletSource.data)
      next()
    } catch (err) {
      res.status(500).send('Error when getting source: ' + err.message)
    }
  } else {
    res.status(500).send('Source not defined!')
  }

})

// Helper functions
function buildPortletMap() {
// Build portlet map
  return (config.portlets || []).reduce((result, item, index, array) => {
    result[item.id] = item;
    return result;
  }, {});
}


async function getPortletSources() {
  return new Promise(async (resolve, reject) => {
    let results = '';
    for (let i = 0; i < (config.sources || []).length; i++) {
      try {
        log.info('Getting remote source: ' + config.sources[i]);
        let portletSource = await axios({
          method: 'get',
          url: config.sources[i],
          timeout: 1000
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



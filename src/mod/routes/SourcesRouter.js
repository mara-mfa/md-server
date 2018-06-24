import express from 'express'
import log from '../../logger'
import axios from 'axios/index'

export default class SourcesRouter {
  get router () {
    return this._router
  }

  constructor (SOURCES) {
    this.SOURCES = SOURCES
    this._router = express.Router()
    this.load()

    this.router.get('/', async (req, res, next) => {
      this.load()
      res.send(this._portletSources)
      res.end()
    })
  }

  async load () {
    this._portletSources = await this.getPortletSources(this.SOURCES)
  }

  async getPortletSources (sources) {
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
          log.warn('Cannot load sources from ' + sources[i] + ' (' + err.message + ')')
          results += 'console.warn("Server error: cannot load sources from: ' + sources[i] + '");'
        }
      }
      log.info('Available sources loaded')
      resolve(results)
    })
  }
}

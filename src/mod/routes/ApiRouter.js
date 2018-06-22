import express from 'express'
import MdUtils from '@pgmtc/md-lib/server/MdUtils'
import log from '../../logger'

export default class ApiRouter {
  get router() {
    return this._router
  }

  constructor(MSGHUB_ID, mdHub) {
    this.MSGHUB_ID = MSGHUB_ID
    this.mdHub = mdHub
    this._router = express.Router()
    this._router.get('/:component/:method/:params', ::this.handleApiCall)
    this._router.get('/:component/:method', ::this.handleApiCall)
  }

  async handleApiCall(req, res, next) {
    // Parse properties
    var component = req.params.component
    var method = req.params.method
    var params = MdUtils.decodeApiParams(req.params.params)

    if (!this.mdHub) {
      next(new Error(`Error when invoking ${component}.${method}(...): Cannot access message hub (NATS is either disabled or there is some other problem)`))
    }

    // Inject context
    params = Array.isArray(params) ? params : [params]
    params.unshift({ auth: req.user })

    // Invoke remote endpoint
    let endpoint = this.MSGHUB_ID + '.' + component + '.' + method
    log.silly(`Invoking remote function ${endpoint}(...)`)

    try {
      let results = await this.mdHub.invoke.apply(this.mdHub, [endpoint].concat(params))
      res.send(results)
    } catch (err) {
      next(err)
    }
  }
}

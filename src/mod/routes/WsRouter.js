import express from 'express'
import log from '../../logger'

export default class WsRouter {
  get router() {
    return this._router
  }

  constructor(mdHub) {
    this.mdHub = mdHub
    this._router = express.Router()
    this._router.get('/:queue/:msg', ::this.handleMessage)
  }

  handleMessage(req, res, next) {
    var queue = req.params.queue
    var msg = JSON.parse(req.params.msg)
    var context = {
      auth: req.user
    }

    var qMsg = {
      context: context,
      message: msg
    }

    if (this.mdHub && this.mdHub.publish) {
      this.mdHub.publish('ws.broadcast.' + queue, JSON.stringify(qMsg))
      res.send({message: 'Message sent to queue: ' + queue})
    } else {
      var errMessage = `Broadcast message stopped. NATS is disabled or mdHub is not available`
      log.error(errMessage)
      res.status(500).send({message: errMessage})
    }
  }
}

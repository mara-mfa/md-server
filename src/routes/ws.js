import express from 'express'
import log from '../logger'
const router = express.Router()

router.get('/', (req, res, next) => {
  res.send('WS root')
})

router.get('/:queue/:msg', (req, res, next) => {
  var queue = req.params.queue
  var msg = JSON.parse(req.params.msg)
  var context = {
    auth: req.user
  }

  var qMsg = {
    context: context,
    message: msg
  }
  if (global.mdHub && global.mdHub.publish) {
    global.mdHub.publish('ws.broadcast.' + queue, JSON.stringify(qMsg))
    res.send({message: 'Message sent to queue: ' + queue})
  } else {
    var errMessage = `Broadcast message stopped. NATS is disabled or mdHub is not available`
    log.error(errMessage)
    res.status(500).send({message: errMessage})
  }
})

export default router

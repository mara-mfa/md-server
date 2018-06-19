import express from 'express'
import config from 'config'
import NATS from 'nats'
const router = express.Router()
const natsServer = process.env.MSGHUB_SERVER || config.MSGHUB_SERVER || undefined
const nats = NATS.connect(natsServer)

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
  nats.publish('ws.broadcast.' + queue, JSON.stringify(qMsg))
  res.send({message: 'Message sent to queue: ' + queue})
})

export default router

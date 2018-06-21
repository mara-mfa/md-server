import Module from "../Module"
import log from "../logger"

export default class Nats extends Module {
  initialize() {
    const MdMessageHub = require('md-lib/server/MdMessageHub').default
    global.mdHub = new MdMessageHub(this.config.MSGHUB_ID, this.config.MSGHUB_CLIENT)
    global.mdHub.connect(this.config.MSGHUB_SERVER).then(() => {
      log.info(`Successfully connected to messaging server ${this.config.MSGHUB_SERVER}`)
    }, (err) => {
      log.error(`Error when connecting to messaging server ${this.config.MSGHUB_SERVER}`, err)
      process.exit(1)
    })

    global.mdHub.subscribe('ws.broadcast.>', (msg, reply, subject) => {
      let wsSubject = subject.replace(/ws\.broadcast\./, '')
      log.silly('Received broadcast request: ' + wsSubject + ' (nats: ' + subject + ')')
      let qMsg = JSON.parse(msg)
      // let context = qMsg.context
      // let message = qMsg.message
      this.io.emit(wsSubject, qMsg)
    })

    global.mdHub.subscribe(this.config.MSGHUB_ID + '.ws.>', (msg, reply, subject) => {
      var wsSubject = subject.replace(this.config.MSGHUB_ID + '.ws.', '')
      log.silly('Received ws coms: ' + wsSubject + ' (nats: ' + subject + ')')
      this.io.emit(wsSubject, msg)
    })
  }

  validate() {
    let config = this.config
    let errMessages = []

    return errMessages
  }
}

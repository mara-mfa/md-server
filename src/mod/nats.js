import Module from "../Module"
import log from "../logger"

export default class Nats extends Module {
  get mdHub() {
    return this._mdHub
  }

  initialize() {
    const MdMessageHub = require('@pgmtc/md-lib/server/MdMessageHub').default
    this._mdHub = new MdMessageHub(this.config.MSGHUB_ID, this.config.MSGHUB_CLIENT)
    this._mdHub.connect(this.config.MSGHUB_SERVER).then(() => {
      log.info(`Successfully connected to messaging server ${this.config.MSGHUB_SERVER}`)
    }, (err) => {
      log.error(`Error when connecting to messaging server ${this.config.MSGHUB_SERVER}`, err)
      process.exit(1)
    })

    this._mdHub.subscribe('ws.broadcast.>', (msg, reply, subject) => {
      let wsSubject = subject.replace(/ws\.broadcast\./, '')
      log.silly('Received broadcast request: ' + wsSubject + ' (nats: ' + subject + ')')
      let qMsg = JSON.parse(msg)
      // let context = qMsg.context
      // let message = qMsg.message
      if (this.modules.sockets && this.modules.sockets.io) {
        let io = this.modules.sockets.io
        io.emit(wsSubject, qMsg)
      } else {
        log.warn('Sockets module has been disabled or it is not available')
      }
    })

    this._mdHub.subscribe(this.config.MSGHUB_ID + '.ws.>', (msg, reply, subject) => {
      var wsSubject = subject.replace(this.config.MSGHUB_ID + '.ws.', '')
      log.silly('Received ws coms: ' + wsSubject + ' (nats: ' + subject + ')')
      if (this.modules.sockets && this.modules.sockets.io) {
        let io = this.modules.sockets.io
        io.emit(wsSubject, msg)
      } else {
        log.warn('Sockets module has been disabled or it is not available')
      }
    })
  }

  validate() {
    let config = this.config
    let errMessages = []

    return errMessages
  }
}

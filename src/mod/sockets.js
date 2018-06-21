import Module from "../Module"
import log from "../logger"
import socket from "socket.io"

export default class Proxy extends Module {
  initialize() {
    let httpServer = this.modules.webServer.httpServer
    let io = socket(httpServer)
    // io.set('transports', ['websocket']);
    io.on('connection', this.onIoConnection.bind(this))
  }

  validate() {
    let config = this.config
    let errMessages = []

    return errMessages
  }

  start() {

  }

  onIoConnection (socket) {
    var socketId = socket.id
    var clientIp = socket.request.connection.remoteAddress
    var message = 'Socket id ' + socketId + ' connected from ' + clientIp
    socket.emit('mdesktop', message)

    socket.on('disconnect', () => {
      log.debug('Socket id ' + socketId + ' disconnected from ' + clientIp)
      log.debug('user disconnected')
    })

    socket.on('refresh', (msg) => {
      socket.emit('refresh', true)
    })
  }
}

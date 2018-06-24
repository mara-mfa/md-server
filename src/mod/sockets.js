import Module from '../Module'
import log from '../logger'
import socket from 'socket.io'

export default class Proxy extends Module {
  get io () {
    return this._io
  }

  initialize () {
    let httpServer = this.modules.webServer.httpServer
    this._io = socket(httpServer)
    // this._io.set('transports', ['websocket']);
    this._io.on('connection', this.onIoConnection.bind(this))
  }

  validate () {
    let errMessages = []
    return errMessages
  }

  start () {

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

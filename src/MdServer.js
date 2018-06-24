import log from './logger'
import socket from 'socket.io'

export default class MdServer {
  constructor (mdConfig) {
    this.config = mdConfig
    this.initialize()
  }

  initialize () {
    // Register modules
    this.modules = {}
    this.use('webServer', require('./mod/webServer'))
    if (!this.config.DISABLE_STORAGE) this.use('storage', require('./mod/storage'))
    this.use('auth', require('./mod/auth'))
    if (!this.config.DISABLE_NATS) this.use('nats', require('./mod/nats'))
    if (!this.config.DISABLE_SOCKETS) this.use('sockets', require('./mod/sockets'))
    this.use('router', require('./mod/router'))
    if (!this.config.DISABLE_PROXY) this.use('proxy', require('./mod/proxy'))

    if (!this.validateModules()) {
      process.exit(1)
    }

    this.loadModules()
    return this
  }

  use (modId, module) {
    let ModuleClass = module.default
    let moduleInstance = new ModuleClass(modId, this.modules, this.config)
    this.modules[modId] = moduleInstance
  }

  validateModules () {
    let errMessages = []
    Object.keys(this.modules).forEach((modKey) => {
      let mod = this.modules[modKey]
      errMessages = errMessages.concat(mod.validate() || [])
    })
    if (errMessages.length > 0) {
      errMessages.forEach((errMessage) => {
        log.error(errMessage)
      })
    }
    return (errMessages || []).length === 0
  }

  loadModules () {
    Object.keys(this.modules).forEach((modKey) => {
      let mod = this.modules[modKey]
      log.info(`Initializing module ${modKey}`)
      mod.initialize()
    })
  }

  startModules () {
    Object.keys(this.modules).forEach((modKey) => {
      let mod = this.modules[modKey]
      mod.start()
    })
  }

  listen () {
    process.on('SIGINT', this.exitHandler(0))
    process.on('SIGUSR1', this.exitHandler(0))
    process.on('SIGUSR2', this.exitHandler(0))
    process.on('uncaughtException', this.exitHandler(1))
    process.on('unhandledRejection', this.exitHandler(1))

    this.startModules()
  }

  registerSocket (httpServer) {
    this.io = socket(httpServer)
    // this.io.set('transports', ['websocket']);
    this.io.on('connection', this.onIoConnection.bind(this))
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

  registerNats () {

  }

  exitHandler (exitCode) {
    return (err) => {
      if (err) {
        log.error(err.message)
        log.debug(err)
      }
      global.mdHub && global.mdHub.close && global.mdHub.close()
      process.exit(exitCode)
    }
  }
}

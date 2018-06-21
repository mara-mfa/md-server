import log from './logger'
import socket from 'socket.io'
import proxy from 'http-proxy-middleware'
import path from 'path'

export default class MdServer {
  constructor (mdConfig) {
    this.mdConfig = mdConfig || require('config')

    this.DISABLE_NATS = process.env.DISABLE_NATS || 0
    this.DISABLE_PROXY = process.env.DISABLE_PROXY || 0
    this.DISABLE_AUTH = process.env.DISABLE_AUTH || 0
    this.DISABLE_SOCKETS = process.env.DISABLE_SOCKETS || 0
    this.DISABLE_STORAGE = process.env.DISABLE_STORAGE || 0

    this.config = {}
    this.config.WEB_CLIENT = process.env.WEB_CLIENT
    this.config.MSGHUB_SERVER = process.env.MSGHUB_SERVER || 'nats://localhost:4222'
    this.config.MSGHUB_ID = process.env.MSGHUB_ID || 'mdesktop'
    this.config.MSGHUB_CLIENT = process.env.MSGHUB_CLIENT || 'mdesktop'
    this.config.SESSION_SECRET = process.env.SESSION_SECRET || 'jcIp866jEH'
    this.config.PORT = process.env.PORT || 8080
    this.config.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
    this.config.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
    this.config.AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL || ''
    this.config.LAYOUT = this.mdConfig.layout
    this.config.PORTLETS = this.mdConfig.portlets
    this.config.PROXIES = this.mdConfig.proxies
    this.config.SOURCES = this.mdConfig.sources
    this.config.MONGODB_URL = process.env.MONGODB_URL

    // Register modules
    this.modules = {}
    this.use('webServer', require('./mod/webServer'))
    if (!this.DISABLE_AUTH) this.use('auth', require('./mod/auth'))
    if (!this.DISABLE_NATS) this.use('nats', require('./mod/nats'))
    if (!this.DISABLE_PROXY) this.use('proxy', require('./mod/proxy'))
    if (!this.DISABLE_SOCKETS) this.use('sockets', require('./mod/sockets'))
    if (!this.DISABLE_STORAGE) this.use('storage', require('./mod/storage'))

    this.loadModules()
  }

  use(modId, module) {
    let moduleInstance = new module.default(modId, this.modules, this.config)
    this.modules[modId] = moduleInstance
  }

  validateModules () {
    let errMessages = []
    Object.keys(this.modules).forEach((modKey) => {
      let mod = this.modules[modKey]
      errMessages.concat(mod.validate() || [])
    })
    if (errMessages.length > 0) {
      errMessages.forEach((errMessage) => {
        log.error(errMessage)
      })
    }
    return (errMessages || []).length === 0
  }

  loadModules() {
    Object.keys(this.modules).forEach((modKey) => {
      let mod = this.modules[modKey]
      log.info(`Initializing module ${modKey}`)
      mod.initialize()
    })
  }

  startModules() {
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
    if (this.validateModules()) {
      this.startModules()
    }
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

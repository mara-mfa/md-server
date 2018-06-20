import express from 'express'
import cookieSession from 'cookie-session'
import bodyParser from 'body-parser'
import passport from 'passport'
import http from 'http'
import mdRoute from './routes/index'
import authRoute from './auth'
import log from './logger'
import socket from 'socket.io'
import proxy from 'http-proxy-middleware'

const defaultConfig = require('../config/default')

export default class MdServer {
  constructor (mdConfig) {
    this.config = mdConfig || defaultConfig

    this.DISABLE_NATS = process.env.DISABLE_NATS || 0
    this.DISABLE_PROXY = process.env.DISABLE_PROXY || 0
    this.DISABLE_AUTH = process.env.DISABLE_AUTH || 0
    this.DISABLE_SOCKETS = process.env.DISABLE_SOCKETS || 0
    this.WEB_CLIENT = process.env.WEB_CLIENT

    this.MSGHUB_SERVER = process.env.MSGHUB_SERVER || undefined
    this.MSGHUB_ID = process.env.MSGHUB_ID || 'mdesktop'
    this.MSGHUB_CLIENT = process.env.MSGHUB_CLIENT || 'mdesktop'
    this.SESSION_SECRET = process.env.SESSION_SECRET || 'jcIp866jEH'
    this.PORT = process.env.PORT || 8080
    this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
    this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
    this.AUTH_CALLBACK_URL = process.env.AUTH_CALLBACK_URL || ''

    this.LAYOUT = this.config.layout
    this.PORTLETS = this.config.portlets
    this.PROXIES = this.config.proxies
    this.SOURCES = this.config.sources


  }

  listen () {
    var cookieSes = cookieSession({
      name: 'mdesktop', keys: [this.SESSION_SECRET], maxAge: 24 * 60 * 60 * 1000
    })

    if (!this.DISABLE_NATS) {
      const MdMessageHub = require('md-lib/server/MdMessageHub').default
      global.mdHub = new MdMessageHub(this.MSGHUB_ID, this.MSGHUB_CLIENT)
      global.mdHub.connect(this.MSGHUB_SERVER).then(() => {
        log.info(`Successfully connected to messaging server ${this.MSGHUB_SERVER}`)
      }, (err) => {
        log.error(`Error when connecting to messaging server ${this.MSGHUB_SERVER}`, err)
        process.exit(1)
      })
    } else {
      log.warn(`NATS disabled by DISABLE_NATS = ${this.DISABLE_NATS}`)
    }

    let app = express()
    let httpServer = http.Server(app)

    app.use(cookieSes)
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use('*', (req, res, next) => {
      req.LAYOUT = this.LAYOUT
      req.SOURCES = this.SOURCES
      req.PORTLETS = this.PORTLETS
      next()
    })
    app.use('/auth', authRoute.getRoutes(this.DISABLE_AUTH, this.GOOGLE_CLIENT_ID, this.GOOGLE_CLIENT_SECRET, this.AUTH_CALLBACK_URL))

    app.use('*', (req, res, next) => {
      if (!req.user && !this.DISABLE_AUTH) {
        res.redirect('/auth/google')
        return
      }
      if (this.DISABLE_AUTH) {
        req.user = {id: 0, displayName: 'mockUser', email: 'mock@email.com'}
      }
      next()
    })

    app.use('/md', mdRoute)
    this.DISABLE_SOCKETS || this.registerSocket(httpServer)
    this.DISABLE_NATS || this.registerNats()
    this.registerProxies(app)

    app.use(express.static('dist-client'))

    httpServer.listen(this.PORT, (err) => {
      if (err) {
        log.error('Error when starting the server: ' + err)
      }
      log.info(`mDesktop Server running on http://localhost:${this.PORT}`)
    })

    // Cleanup
    process.on('exit', this.cleanup)
    process.on('SIGINT', this.cleanup)
    process.on('SIGUSR1', this.cleanup)
    process.on('SIGUSR2', this.cleanup)
    process.on('uncaughtException', this.cleanup)
  }

  registerProxies (app) {
    let proxyList = (this.DISABLE_PROXY ? [] : this.PROXIES) || []
    if (this.WEB_CLIENT) {
      proxyList.push({
        source: '/',
        target: this.WEB_CLIENT
      })
      log.info(`'root (/) is pointing to web client on address ${this.WEB_CLIENT} and will be accessible on '/'`)
    } else {
      log.warn('WEB_CLIENT is not defined. There will be no web client')
    }

    proxyList.forEach((proxyItem) => {
      var src = proxyItem.source
      var target = proxyItem.target
      var pathRewriteValue = {}
      pathRewriteValue['^' + src] = '/'
      app.use(src, proxy({
        target: target,
        changeOrigin: true,
        ws: false,
        pathRewrite: pathRewriteValue,
        proxyTimeout: 3000,
        onProxyReq: (proxyReq, req, res) => {
          // add login information to the proxied requests
          proxyReq.setHeader('md-user', JSON.stringify(req.user))
          // or log the req
        }
      }))
    })
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
    global.mdHub.subscribe('ws.broadcast.>', (msg, reply, subject) => {
      let wsSubject = subject.replace(/ws\.broadcast\./, '')
      log.silly('Received broadcast request: ' + wsSubject + ' (nats: ' + subject + ')')
      let qMsg = JSON.parse(msg)
      // let context = qMsg.context
      // let message = qMsg.message
      this.io.emit(wsSubject, qMsg)
    })

    global.mdHub.subscribe(this.MSGHUB_ID + '.ws.>', (msg, reply, subject) => {
      var wsSubject = subject.replace(this.MSGHUB_ID + '.ws.', '')
      log.silly('Received ws coms: ' + wsSubject + ' (nats: ' + subject + ')')
      this.io.emit(wsSubject, msg)
    })
  }

  cleanup (err) {
    if (err) {
      log.error(err.message)
      log.debug(err)
    }
    global.mdHub && global.mdHub.close && global.mdHub.close()
    process.exit(0)
  }
}

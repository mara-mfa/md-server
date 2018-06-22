import Module from "../Module"
import bodyParser from "body-parser"
import cookieSession from "cookie-session"
import express from "express"
import http from 'http'
import log from "../logger"


export default class WebServer extends Module {
  get app () {
    return this._app
  }

  get httpServer () {
    return this._httpServer
  }

  validate() {
    let config = this.config
    let errMessages = []

    return errMessages
  }

  initialize() {
    let config = this.config
    this._app = express()
    let cookieSes = cookieSession({ name: 'mdesktop', keys: [config.SESSION_SECRET], maxAge: 24 * 60 * 60 * 1000 })
    this._httpServer = http.Server(this._app)
    this._app.use(cookieSes)
    this._app.use(bodyParser.urlencoded({extended: false}))
    this._app.use('*', (req, res, next) => {
      if (config.DISABLE_AUTH) {
        req.user = {id: 0, displayName: 'mockUser', email: 'mock@email.com'}
      }
      next()
    })

  }

  start() {
    this._app.use(function (err, req, res, next) {
      log.error(err.message)
      log.silly(err)
      res.status(500).send({
        type: 'E',
        message: err.message
      })
    })

    this._httpServer.listen(this.config.PORT, (err) => {
      if (err) {
        log.error('Error when starting the server: ' + err)
      }
      log.info(`mDesktop Server running on http://localhost:${this.config.PORT}`)
    })
  }
}

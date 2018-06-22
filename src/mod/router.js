import Module from "../Module"
var pjson = require('../../package.json')
import express from "express"
import ApiRouter from "./routes/ApiRouter"
import GrpcRouter from "./routes/GrpcRouter"
import SourcesRouter from "./routes/SourcesRouter"
import WsRouter from "./routes/WsRouter"

export default class Auth extends Module {

  initialize() {
    let app = this.modules.webServer.app
    let config = this.config
    let router = express.Router()

    router.get('/', function (req, res, next) {
      res.send({
        version: pjson.version,
        user: req.user,
        layout: config.LAYOUT,
        portlets: config.PORTLETS,
        theme: 'light'
      })
    })


    app.use('/md', router)
    router.use('/sources', new SourcesRouter(this.config.SOURCES).router)

    //TODO: disable routes based on configuration
    if (!this.config.DISABLE_NATS) router.use('/api', new ApiRouter(this.config.MSGHUB_ID, (this.modules.nats || {}).mdHub).router)
    if (!this.config.DISABLE_GRPC) router.use('/grpc', new GrpcRouter(this.config.PORTLETS).router)
    if (!this.config.DISABLE_SOCKETS) router.use('/ws', new WsRouter((this.modules.nats || {}).mdHub).router)
    //TODO: split auth module into auth module and its routes, provide routes here

  }

  validate() {
    let config = this.config
    let errMessages = []
    return errMessages
  }

}

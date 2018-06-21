import Module from "../Module"
import log from "../logger"
import proxy from "http-proxy-middleware"

export default class Proxy extends Module {
  initialize() {
    let config = this.config
    let app = this.modules.webServer.app
    let proxyList = (config.DISABLE_PROXY ? {} : config.PROXIES) || {}
    if (config.WEB_CLIENT) {
      proxyList['/'] = config.WEB_CLIENT
      log.info(`'root (/) is pointing to web client on address ${config.WEB_CLIENT} and will be accessible on '/'`)
    }

    Object.keys(proxyList).forEach((src) => {
      let target = proxyList[src]
      let pathRewriteValue = {}
      let srcTrim = src.replace(/^\//, '') // Remove potential starting /
      pathRewriteValue['^/' + srcTrim] = '/'
      app.use('/' + srcTrim, proxy({
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

  validate() {
    let config = this.config
    let errMessages = []
    if (!config.WEB_CLIENT) log.warn('WEB_CLIENT is not defined. There will be no web client')
    return errMessages
  }

  start() {

  }
}

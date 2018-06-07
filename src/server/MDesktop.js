import config from 'config'
import proxy from 'http-proxy-middleware'
import socket from 'socket.io'
import NATS from 'nats'
import log from './logger'

const natsServer = process.env.MSGHUB_SERVER || undefined;

const nats = NATS.connect(natsServer);

export default class MDesktop {
  /* Method reads all portlets and suck proxy values from them. Then Registers these proxies */
  registerProxies(app) {
    let portlets = config.portlets || []
    let proxyList = config.proxies || []

    proxyList.forEach((proxyItem) => {
      console.log(proxyItem);
      var src = proxyItem.source
      var target = proxyItem.target
      var pathRewriteValue = {}
      pathRewriteValue['^' + src] = '/'
      app.use(src, proxy({
        target: target,
        changeOrigin: true,
        ws: false,
        pathRewrite: pathRewriteValue
      }))
    })


    // let proxies = {}
    // portlets.forEach((portlet) => {
    //   if (portlet.proxy && portlet.proxy.source) {
    //     proxies[portlet.proxy.source] = portlet.proxy.target
    //   }
    //   delete portlet.proxy
    // })

    // Object.keys(proxies).forEach((proxySrc) => {
    //   var proxyTarget = proxies[proxySrc]
    //   var pathRewriteValue = {}
    //   pathRewriteValue['^' + proxySrc] = '/'
    //   app.use(proxySrc, proxy({
    //     target: proxyTarget,
    //     changeOrigin: true,
    //     ws: false,
    //     pathRewrite: pathRewriteValue
    //   }))
    // })
  }

  registerSocket(httpServer) {
    this.io = socket(httpServer);
    //this.io.set('transports', ['websocket']);
    this.io.on('connection', this.onIoConnection.bind(this));
  }

  onIoConnection(socket) {
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
    var message = 'Socket id ' + socketId + ' connected from ' + clientIp;
    socket.emit('mdesktop', message);

    socket.on('disconnect', () => {
      log.debug('Socket id ' + socketId + ' disconnected from ' + clientIp);
      log.debug('user disconnected');
    });

    socket.on('refresh', (msg) => {
      socket.emit('refresh', true);
    })
  }

  registerNats() {
    nats.subscribe('ws.broadcast.>', (msg, reply, subject) => {
      let wsSubject = subject.replace(/ws\.broadcast\./, '');
      log.debug('Received broadcast request: ' + wsSubject + ' (nats: ' + subject +')');
      let qMsg = JSON.parse(msg)
      let context = qMsg.context
      let message = qMsg.message
      this.io.emit(wsSubject, qMsg);
    })

    nats.subscribe('ws.>', (msg, reply, subject) => {
      var wsSubject = subject.replace(/ws\./, '');
      log.silly('Received ws coms: ' + wsSubject + ' (nats: ' + subject +')');
      this.io.emit(wsSubject, msg);
    });
  }

  cleanup(err) {
    if (err) {
      log.error(err.message)
      log.debug(err)
    }
    nats.close();
    process.exit(0);
  }
}


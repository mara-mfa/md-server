import config from 'config'
import proxy from 'http-proxy-middleware'
import socket from 'socket.io'
import NATS from 'nats'
import log from './logger'

const natsServer = process.env.MSGHUB_SERVER || undefined;

const nats = NATS.connect(natsServer);

export default class MDesktop {
  registerProxies(app) {
    let proxyList = config.proxies || []

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
        proxyTimeout: 1000,
        onProxyReq: (proxyReq, req, res) => {
          // add login information to the proxied requests
          proxyReq.setHeader('md-user', JSON.stringify(req.user));
          // or log the req
        }
      }))
    })
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


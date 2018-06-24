import MdServer from './MdServer'
import config from 'config'

let mdconfig = {
  DISABLE_NATS: process.env.DISABLE_NATS || 0,
  DISABLE_PROXY: process.env.DISABLE_PROXY || 0,
  DISABLE_AUTH: process.env.DISABLE_AUTH || 0,
  DISABLE_SOCKETS: process.env.DISABLE_SOCKETS || 0,
  DISABLE_STORAGE: process.env.DISABLE_STORAGE || 0,
  DISABLE_GRPC: process.env.DISABLE_GRPC || 0,

  WEB_CLIENT: process.env.WEB_CLIENT,
  MSGHUB_SERVER: process.env.MSGHUB_SERVER || 'nats://localhost:4222',
  MSGHUB_ID: process.env.MSGHUB_ID || 'mdesktop',
  MSGHUB_CLIENT: process.env.MSGHUB_CLIENT || 'mdesktop',
  SESSION_SECRET: process.env.SESSION_SECRET || 'jcIp866jEH',
  PORT: process.env.PORT || 8080,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  AUTH_CALLBACK_URL: process.env.AUTH_CALLBACK_URL,
  LAYOUT: config.layout,
  PORTLETS: config.portlets,
  PROXIES: config.proxies,
  SOURCES: config.sources,
  MONGODB_URL: process.env.MONGODB_URL
}

const mdServer = new MdServer(mdconfig)
mdServer.listen()

import MdServer from './MdServer'

const mdServer = new MdServer()
mdServer.DISABLE_AUTH = 1
mdServer.DISABLE_NATS = 1
mdServer.DISABLE_PROXY = 1
mdServer.DISABLE_UI = 1
mdServer.DISABLE_SOCKETS = 0
mdServer.listen()

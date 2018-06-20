import MdServer from './MdServer'
import config from 'config'
import mdWebClient from 'md-web-client'


const mdServer = new MdServer()
mdServer.DISABLE_AUTH = 1
mdServer.DISABLE_NATS = 0
mdServer.DISABLE_PROXY = 0
mdServer.DISABLE_SOCKETS = 0
mdServer.WEB_CLIENT = 'http://localhost:8081'

config.portlets = {
  "mdMonitor": {
    "id": "mdMonitor",
    "type": "js",
    "name": "MD Monitor",
    "class": "mdMonitor.MdMonitor",
    "grpc": {
      "endPoint": "localhost:50051",
      "protoLocation": "http://localhost:9092/grpc"
    }
  },
  "vuePortlet": {
    "id": "vuePortlet",
    "class": "vuePortlet",
    "type": "vue",
    "name": "Vue Component",
    "grpc": "vue-portlet:50051"
  }
}

config.layout = [
  {"x": 0, "y": 0, "w": 2, "h": 2, "i": "mdMonitor"},
  {"x": 0, "y": 0, "w": 2, "h": 2, "i": "mdMonitor"},
  {"x": 2, "y": 0, "w": 2, "h": 2, "i": "vuePortlet"},
  {"x": 2, "y": 0, "w": 2, "h": 2, "i": "vuePortlet"}
]

mdServer.listen()
mdWebClient.listen(8081)

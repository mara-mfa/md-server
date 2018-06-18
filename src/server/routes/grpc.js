import grpc from 'grpc'
import express from 'express';
import config from 'config'
const tempy = require('tempy');
const http = require('http');
const fs = require('fs');

import log from "../logger";
const router = express.Router()

router.get('/', function(req, res, next) {
  res.send('grpc root');
})

router.get('/:component/:method/:params', handleApiCall)
router.get('/:component/:method', handleApiCall)

export default router

async function handleApiCall (req, res, next) {
  try {
    var component = req.params.component
    var method = req.params.method
    var params = JSON.parse(decodeURIComponent(req.params.params || '{}'))
    // Inject context
    params.context = {
      auth: req.user,
    }

    let grpcDef = (config.portlets[component] || {}).grpc
    if (!grpcDef) {
      throw new Error(`Missing GRPC definition for component '${component}'`)
    }
    if (!grpcDef.endPoint || !grpcDef.pkg || !grpcDef.service || !grpcDef.protoLocation) {
      throw new Error(`Missing [endpoint/pkg/service/protoLocation] for component '${component}'`)
    }

    let {endPoint, pkg, service, protoLocation} = grpcDef

    // Load proto file
    let protoFile = await loadProtoFile(protoLocation)
    let grcpProto = grpc.load(protoFile)[pkg]
    if (!grcpProto) {
      throw new Error(`Package '${pkg}' not found in GRPC proto file for component '${component}' (${protoLocation})`)
    }
    if (!grcpProto[service]) {
      throw new Error(`Service '${service}' not found in GRPC proto file for component '${component}' (${protoLocation})`)
    }
    let grcpClient = new grcpProto[service](endPoint, grpc.credentials.createInsecure())
    if (!grcpClient[method]) {
      res.status(500).send(`Method '${method}' does not exist`)
      return
    }
    ::grcpClient[method]({name: 'MDESKTOP'}, (err, response) => {
      if (err) {
        log.error('Error when calling grpc: ' + err.message)
        res.status(500).send(err.message)
        return
      }
      res.send(response.message)
      log.info('GRPC response: ' + response.message)
    })


  } catch (err) {
    log.error(err)
    res.status(500).send(err.message)
  }
}

function loadProtoFile(url) {
  return new Promise((resolve, reject) => {
    let fileName = tempy.file()
    let file = fs.createWriteStream(fileName)
    http.get(url, (response) => {
      const { statusCode } = response;
      if (statusCode !== 200) {
        reject(`Error when downloading proto file from ${url}. HTTP status = ${statusCode}`)
      } else {
        response.pipe(file)
        resolve(fileName)
        log.debug(`Successfully downloaded proto file from ${url}`)
      }
    })
  })
}


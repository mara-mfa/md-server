import grpc from 'grpc'
//import protoLoader from '@grpc/proto-loader'
import express from 'express';
import config from 'config'
const tempy = require('tempy');
const http = require('http');
const fs = require('fs');

import log from "../logger";
const router = express.Router()
const protoLoader = require('@grpc/proto-loader');

let protoDict = {}

router.get('/', function(req, res, next) {
  res.send('grpc root');
})

router.get('/flush-cache', function(req, res, next) {
  protoDict = {}
  res.send('Proto cache cleared')
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
    if (!grpcDef.endPoint || !grpcDef.protoLocation) {
      throw new Error(`Missing [endpoint/pkg/service/protoLocation] for component '${component}'`)
    }

    let {endPoint, protoLocation} = grpcDef


    if (!protoDict[protoLocation]) {
      let protoFile = await loadProtoFile(protoLocation)
      protoDict[protoLocation] = protoLoader.loadSync(protoFile, {})
    }

    // Load proto file
    let grpcObjectDef = grpc.loadPackageDefinition(protoDict[protoLocation])
    let defaultPackage = Object.keys(grpcObjectDef)
    let defaultPkgObject = grpcObjectDef[defaultPackage]
    let defaultServiceName = Object.keys(defaultPkgObject)[0]
    let defaultServiceObject = defaultPkgObject[defaultServiceName]

    let grcpClient = new defaultServiceObject(endPoint, grpc.credentials.createInsecure())
    if (!grcpClient[method]) {
      res.status(500).send(`Method '${method}' does not exist`)
      return
    }

    let methodSignature = `${defaultPackage}.${defaultServiceName}.${method} (endpoint: ${endPoint})`
    log.debug(`Calling ${methodSignature}`)

    let methodCall = ::grcpClient[method]
    let methodParams = {
      name: 'MDESKTOP',
      _userId: req.user.id,
      _userEmail: req.user.email
    }

    methodCall(methodParams, (err, response) => {
      if (err) {
        log.error('Error when calling grpc: ' + err.message)
        res.status(500).send(err.message)
        return
      }
      log.debug(`... response from ${methodSignature}`)
      res.send(response.message)
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
    let request = http.get(url, (response) => {
      const { statusCode } = response;
      if (statusCode !== 200) {
        reject(`Error when downloading proto file from ${url}. HTTP status = ${statusCode}`)
      } else {
        response.pipe(file)
        resolve(fileName)
        log.debug(`Successfully downloaded proto file from ${url}`)
      }
    })
    request.on('error', (err) => {
      reject(`Error when downloading proto file from ${url}: ${err.message}`)
    })
  })
}


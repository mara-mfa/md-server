import express from 'express'
import fs from 'fs'
import http from 'http'
import grpc from 'grpc'
import log from '../../logger'
const tempy = require('tempy')

export default class GrpcRouter {
  get router () {
    return this._router
  }

  constructor (PORTLETS) {
    this.PORTLETS = PORTLETS
    this._router = express.Router()
    this._router.get('/:component/:method/:params', ::this.handleApiCall)
    this._router.get('/:component/:method', ::this.handleApiCall)

    this.protoDict = {}
  }

  async handleApiCall (req, res, next) {
    var component = req.params.component
    var method = req.params.method
    var params = {}

    if (params) {
      try {
        params = JSON.parse(req.params.params)
      } catch (err) {
        return next(new Error('Error when parsing parameters', err))
      }
    }

    let grpcDef = (this.PORTLETS[component] || {}).grpc
    if (!grpcDef) {
      next(new Error(`Missing GRPC definition for component '${component}'`))
    }
    if (!grpcDef.endPoint || !grpcDef.protoLocation) {
      next(new Error(`Missing [endpoint/pkg/service/protoLocation] for component '${component}'`))
    }
    let {endPoint, protoLocation} = grpcDef

    if (!this.protoDict[protoLocation]) {
      try {
        let protoFile = await this.loadProtoFile(protoLocation)
        log.debug(`GRPC proto file stored:  ${protoFile}`)
        const protoLoader = require('@grpc/proto-loader')
        this.protoDict[protoLocation] = protoLoader.loadSync(protoFile, {})
      } catch (err) {
        next(err)
        return
      }
    }

    // Load proto file
    let grpcObjectDef = grpc.loadPackageDefinition(this.protoDict[protoLocation])
    let defaultPackage = Object.keys(grpcObjectDef)
    let defaultPkgObject = grpcObjectDef[defaultPackage]
    let defaultServiceName = Object.keys(defaultPkgObject)[0]
    let DefaultServiceObject = defaultPkgObject[defaultServiceName]

    let grcpClient = new DefaultServiceObject(endPoint, grpc.credentials.createInsecure())
    if (!grcpClient[method]) {
      next(new Error(`Method '${method} does not exist`))
      return
    }

    let methodSignature = `${defaultPackage}.${defaultServiceName}.${method} (endpoint: ${endPoint})`
    log.silly(`Calling ${methodSignature}`)

    let methodCall = ::grcpClient[method]
    let methodParams = params
    methodParams._userId = req.user.id
    methodParams._userEmail = req.user.email

    methodCall(methodParams, (err, response) => {
      if (err) {
        return next(err)
      }
      log.silly(`... response from ${methodSignature}`)
      res.send(response.message)
    })
  }

  loadProtoFile (url) {
    return new Promise((resolve, reject) => {
      let fileName = tempy.file()
      let file = fs.createWriteStream(fileName)
      let request = http.get(url, (response) => {
        const { statusCode } = response
        if (statusCode !== 200) {
          reject(new Error(`Error when downloading proto file from ${url}. HTTP status = ${statusCode}`))
        } else {
          response.pipe(file)
          resolve(fileName)
          log.debug(`Successfully downloaded proto file from ${url}`)
        }
      })
      request.on('error', (err) => {
        reject(new Error(`Error when downloading proto file from ${url}: ${err.message}`))
      })
    })
  }
}

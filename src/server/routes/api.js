import grpc from 'grpc'
import express from 'express';
import MdUtils from 'md-lib/server/MdUtils'
import log from "../logger";
const MSGHUB_ID = process.env.MSGHUB_ID || 'mdesktop'
const router = express.Router()
const invoke = async (endpoint, params) => {
  return global.mdHub.invoke.apply(global.mdHub, [endpoint].concat(params))
}

router.get('/', function(req, res, next) {
  res.send('api root');
})

router.get('/:component/:method/:params', handleApiCall)
router.get('/:component/:method', handleApiCall)

export default router


async function handleApiCall (req, res, next) {
  var component = req.params.component
  var method = req.params.method
  var params = MdUtils.decodeApiParams(req.params.params)
  // Inject context
  params.unshift({
    auth: req.user
  })
  // Invoke function
  // try {
  //   let endpoint = MSGHUB_ID + '.' + component + '.' + method
  //   let results = await invoke(endpoint, params)
  //   res.send(results);
  // } catch (err) {
  //   res.status(500).send(err.message)
  // }

  // Test - call using grpc
  var proto = grpc.load(__dirname + '/../proto/helloworld.proto').helloworld
  var client = new proto.Greeter(`${component}:50051`, grpc.credentials.createInsecure())
  var method = ::client['sayHello']
  method({
    name: 'MDESKTOP'
  }, (err, response) => {
    if (err) {
      log.error('Error when calling grpc: ' + err.message)
      res.status(500).send(err.message)
      return
    }
    res.send(response.message)
    log.info('GRPC response: ' + response.message)
  })



}


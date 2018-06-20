# md-server

## Stand alone mode
If you want to run md-web-client in stand alone mode (in a container, for example), checkout the latest from the repository and run
```
git clone https://github.com/pgmtc/md-server
npm install
npm start
```

To change port which the server runs on, you can provide `PORT`, for example
```
export PORT=8081 && npm start
```

## Running as a module
If you want to run md-server as a module (inside some other node.js application), do the following
```
npm install md-server
```

Then, in the code, do the following:
```
import MdServer from 'md-server'
mdServer.listen()
```

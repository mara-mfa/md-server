rm -rf node_modules
npm install --only=production
docker build -t eu.gcr.io/pgmtc-net/md-server .
docker push eu.gcr.io/pgmtc-net/md-server

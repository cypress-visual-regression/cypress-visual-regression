#!/bin/sh

set -e

npm install
npm run test
npm run lint
npm run prettier:check
npm run build
cd docker
rm -rf dist
mv ../dist dist

if [ -z "${1}" ]
then
  docker build -t cypress-visual-regression .
else
  docker build --build-arg CYPRESS_VERSION=$1 -t cypress-visual-regression .
fi

docker run -d --name cypress-test cypress-visual-regression sleep infinity
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=base'
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=actual'
docker rm -f cypress-test

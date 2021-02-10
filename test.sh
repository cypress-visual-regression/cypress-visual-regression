#!/bin/sh

set -e

npm install
npm run jest
npm run lint
npm run prettier:check
npm run build
cd docker
rm -rf dist
mv ../dist dist

if [ -z "${1}" ]
then
  docker-compose build
else
  docker-compose build --build-arg CYPRESS_VERSION=$1
fi

docker-compose up -d
docker-compose run cypress ./node_modules/.bin/cypress run --env type=base --config baseUrl=http://127.0.0.1
docker-compose run cypress ./node_modules/.bin/cypress run --env type=actual --config baseUrl=http://127.0.0.1

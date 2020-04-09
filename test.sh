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
docker-compose up -d --build
docker-compose run cypress ./node_modules/.bin/cypress run --env type=base --config screenshotsFolder=cypress/snapshots/base,baseUrl=http://127.0.0.1
docker-compose run cypress ./node_modules/.bin/cypress run --env type=actual --config baseUrl=http://127.0.0.1

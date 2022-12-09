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
  docker build -t cypress-visaul-regression .
else
  docker build --build-arg CYPRESS_VERSION=$1 cypress-visaul-regression .
fi

docker run --entrypoint /bin/bash cypress-visual-regression -c './node_modules/.bin/cypress run --env type=base'
docker run --entrypoint /bin/bash cypress-visual-regression -c './node_modules/.bin/cypress run --env type=actual'

#!/bin/sh

set -eux

projectRoot="$(dirname "$0")"
cd "$projectRoot"

npm install
npm run jest
npm run lint
npm run prettier:check
npm run build
cd docker
rm -rf dist
mv ../dist dist

if [ -z "${1-}" ]
then
  docker build -t cypress-visual-regression .
else
  docker build --build-arg CYPRESS_VERSION="${1-}" -t cypress-visual-regression .
fi

docker run --detach --name cypress-test cypress-visual-regression sleep infinity
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=base'
docker exec cypress-test bash -c './node_modules/.bin/cypress run --env type=actual'
docker rm --force cypress-test

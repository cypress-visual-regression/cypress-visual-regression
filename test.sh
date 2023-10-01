#!/bin/sh

set -e

npm install
npm run test
#npm run lint
npm run format:check
npm run build

if [ -z "${1}" ]
then
  docker build -t cypress-visual-regression .
else
  docker build --build-arg CYPRESS_VERSION=$1 -t cypress-visual-regression .
fi

docker run --name cypress-test cypress-visual-regression
docker rm -f cypress-test

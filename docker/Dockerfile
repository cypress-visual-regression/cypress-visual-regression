# base image
FROM cypress/browsers:node14.16.0-chrome90-ff88

# set variables
ARG CYPRESS_VERSION=8.0.0
ENV SNAPSHOT_DIRECTORY /usr/src/app/cypress/snapshots
ENV CI true
RUN echo ${CYPRESS_VERSION}

# set working directory
WORKDIR /usr/src/app

# install cypress, and cypress-visual-regression
COPY package.json /usr/src/app/package.json
RUN npm install cypress@${CYPRESS_VERSION}
RUN npm install

# copy cypress files and folders
COPY cypress /usr/src/app/cypress
COPY cypress.json /usr/src/app/cypress.json

# copy dist
COPY dist /usr/src/app/dist

# confirm the cypress install
RUN ./node_modules/.bin/cypress verify

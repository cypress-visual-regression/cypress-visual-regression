# base image
FROM cypress/browsers:node14.15.0-chrome86-ff82

# set variables
ARG CYPRESS_VERSION=6.4.0
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

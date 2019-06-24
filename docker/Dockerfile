# base image
FROM cypress/browsers:chrome69

# set cypress version
ENV CYPRESS_VERSION 3.2.0
ENV SNAPSHOT_DIRECTORY /usr/src/app/cypress/snapshots
ENV CI true npm install cypress

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

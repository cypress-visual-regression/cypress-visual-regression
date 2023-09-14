ARG CYPRESS_VERSION=13.1.0

# base image
FROM cypress/included:${CYPRESS_VERSION}

ENV SNAPSHOT_DIRECTORY /usr/src/app/cypress/snapshots
ENV CI true
RUN echo ${CYPRESS_VERSION}

# set working directory
WORKDIR /usr/src/app

# install cypress, and cypress-visual-regression
COPY docker/package.json /usr/src/app/package.json
#RUN npm install cypress@${CYPRESS_VERSION}
RUN npm install

# copy cypress files and folders
COPY cypress /usr/src/app/cypress
COPY cypress.config.ts /usr/src/app/cypress.config.ts
COPY cypress/web /usr/src/app/web

# copy dist
COPY dist /usr/src/app/dist

# confirm the cypress install
RUN ./node_modules/.bin/cypress verify

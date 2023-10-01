ARG CYPRESS_VERSION=13.2.0

# base image
FROM cypress/included:${CYPRESS_VERSION}

#ENV SNAPSHOT_DIRECTORY /usr/src/app/cypress/snapshots
ENV CI true
RUN echo ${CYPRESS_VERSION}

# set working directory
WORKDIR /e2e

# install cypress, and cypress-visual-regression
COPY package.json .
#RUN npm install cypress@${CYPRESS_VERSION}
RUN npm install

# copy cypress files and folders
COPY cypress .
COPY cypress.base.config.ts .
COPY cypress.regression.config.ts .

# copy dist
COPY dist .

# confirm the cypress install
ENTRYPOINT ["npm", "run", "ci"]

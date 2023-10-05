ARG CYPRESS_VERSION=13.2.0

FROM cypress/included:${CYPRESS_VERSION}

ENV CI true
RUN echo ${CYPRESS_VERSION}

WORKDIR /e2e

COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

RUN npm install

# copy cypress files and folders
COPY cypress .
COPY cypress.base.config.ts .
COPY cypress.regression.config.ts .
COPY tsconfig.json .

# copy dist
COPY dist .

# confirm the cypress install
ENTRYPOINT ["npm", "run", "ci"]

FROM octoblu/node:8-alpine-gyp

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/
RUN yarn --no-progress --no-emoji --production && yarn cache clean
COPY . /usr/src/app
RUN yarn link

ENTRYPOINT ["beekeeper"]

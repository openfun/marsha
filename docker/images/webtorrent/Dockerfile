FROM node:20-bookworm-slim as base

FROM  base as builder

WORKDIR /app

COPY src/webtorrent .

RUN yarn install --frozen-lockfile

RUN yarn build

FROM base as production

ENV NODE_ENV production

RUN mkdir -p /app/dist
WORKDIR /app

COPY src/webtorrent/package.json .
COPY src/webtorrent/yarn.lock .

RUN yarn install --production --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

CMD ["node", "./dist/app.js"]
FROM node:18.20.7-slim AS core

WORKDIR /var/task

# Copy sources
COPY function-transfer /var/task/function-transfer/

# Image used in developement with development dependencies
FROM core AS development

RUN cd function-transfer && yarn install && cd .. && \
    yarn cache clean

CMD [ "node", "index.js" ]

FROM busybox as mediainfo

ARG MEDIAINFO_VERSION=20.09

# Embed the mediainfo layer in the image
RUN wget https://mediaarea.net/download/binary/mediainfo/20.09/MediaInfo_CLI_${MEDIAINFO_VERSION}_Lambda.zip && \
    unzip MediaInfo_CLI_${MEDIAINFO_VERSION}_Lambda.zip -d /tmp/mediainfo

FROM amazon/aws-lambda-nodejs:14 as core

# COPY mediainfo in core stage
COPY --from=mediainfo /tmp/mediainfo/bin/mediainfo /opt/bin/mediainfo

# Copy sources
# LAMBDA_TASK_ROOT is defined in base image and its value is /var/task
COPY lambda-complete ${LAMBDA_TASK_ROOT}/lambda-complete/
COPY lambda-configure ${LAMBDA_TASK_ROOT}/lambda-configure/
COPY lambda-elemental-routing ${LAMBDA_TASK_ROOT}/lambda-elemental-routing/
COPY lambda-encode ${LAMBDA_TASK_ROOT}/lambda-encode/
COPY lambda-medialive ${LAMBDA_TASK_ROOT}/lambda-medialive/
COPY lambda-mediapackage ${LAMBDA_TASK_ROOT}/lambda-mediapackage/
COPY lambda-migrate ${LAMBDA_TASK_ROOT}/lambda-migrate/
COPY utils ${LAMBDA_TASK_ROOT}/utils/

# Install yarn and yarn-recursive
RUN npm install -g yarn

# configure volume for lambda mediapackge
VOLUME /mnt/transcoded_video

# Image used in developement with development dependencies
FROM core as development

RUN cd lambda-complete && yarn install
RUN cd lambda-configure && yarn install
RUN cd lambda-encode && yarn install
RUN cd lambda-medialive && yarn install
RUN cd lambda-mediapackage && yarn install
RUN cd lambda-elemental-routing && yarn install
RUN cd lambda-migrate && yarn install

CMD [ "index.handler" ]

# Image used in production without development dependencies
FROM core as production

RUN cd lambda-complete && yarn install --frozen-lockfile --production=true
RUN cd lambda-configure && yarn install --frozen-lockfile --production=true
RUN cd lambda-encode && yarn install --frozen-lockfile --production=true
RUN cd lambda-medialive && yarn install --frozen-lockfile --production=true
RUN cd lambda-mediapackage && yarn install --frozen-lockfile --production=true
RUN cd lambda-elemental-routing && yarn install --frozen-lockfile --production=true
RUN cd lambda-migrate && yarn install --frozen-lockfile --production=true

CMD [ "index.handler" ]

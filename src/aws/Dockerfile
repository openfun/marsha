FROM busybox as mediainfo

ARG MEDIAINFO_VERSION=20.09

# Embed the mediainfo layer in the image
RUN wget https://mediaarea.net/download/binary/mediainfo/20.09/MediaInfo_CLI_${MEDIAINFO_VERSION}_Lambda.zip && \
    unzip MediaInfo_CLI_${MEDIAINFO_VERSION}_Lambda.zip -d /tmp/mediainfo

FROM amazon/aws-lambda-nodejs:14 as core
ARG POPPLER_VERSION
ARG POPPLER_DATA_VERSION
ARG OPENJPEG_VERSION

# COPY mediainfo in core stage
COPY --from=mediainfo /tmp/mediainfo/bin/mediainfo /opt/bin/mediainfo

# Copy sources
# LAMBDA_TASK_ROOT is defined in base image and its value is /var/task
COPY lambda-complete ${LAMBDA_TASK_ROOT}/lambda-complete/
COPY lambda-configure ${LAMBDA_TASK_ROOT}/lambda-configure/
COPY lambda-elemental-routing ${LAMBDA_TASK_ROOT}/lambda-elemental-routing/
COPY lambda-convert ${LAMBDA_TASK_ROOT}/lambda-convert/
COPY lambda-medialive ${LAMBDA_TASK_ROOT}/lambda-medialive/
COPY lambda-mediapackage ${LAMBDA_TASK_ROOT}/lambda-mediapackage/
COPY lambda-migrate ${LAMBDA_TASK_ROOT}/lambda-migrate/
COPY utils ${LAMBDA_TASK_ROOT}/utils/

# Install yarn and yarn-recursive
RUN npm install -g yarn

# configure volume for lambda mediapackge
VOLUME /mnt/transcoded_video

WORKDIR /root

## Install packages needed to compile poppler
RUN yum install -y \
   cairo-devel \
   cmake \
   cmake3 \
   fontconfig-devel \
   gcc \
   gcc-c++ \
   gzip \
   libjpeg-devel \
   libpng-devel \
   libtiff-devel \
   make \
   tar \
   xz \
   zip && \
## download poppler, poppler-data and openjpeg
    curl -k -o poppler.tar.xz https://poppler.freedesktop.org/poppler-${POPPLER_VERSION}.tar.xz && \
    tar -xf poppler.tar.xz && \
    curl -k -o poppler-data.tar.gz https://poppler.freedesktop.org/poppler-data-${POPPLER_DATA_VERSION}.tar.gz && \
    tar -xf poppler-data.tar.gz && \
    curl -k -o openjpeg.tar.gz https://codeload.github.com/uclouvain/openjpeg/tar.gz/refs/tags/v${OPENJPEG_VERSION} && \
    tar -xf openjpeg.tar.gz && \
## install poppler-data
    cd poppler-data-${POPPLER_DATA_VERSION} && make install && cd /root && \
## build and install openjpeg
    mkdir openjpeg-${OPENJPEG_VERSION}/build && \
    cd openjpeg-${OPENJPEG_VERSION}/build && \
    cmake .. -DCMAKE_BUILD_TYPE=Release && \
    make && \
    make install && cd /root && \
## build and install poppler
    mkdir poppler-${POPPLER_VERSION}/build && \
    cd poppler-${POPPLER_VERSION}/build && \
    cmake3 .. -DCMAKE_BUILD_TYPE=release -DBUILD_GTK_TESTS=OFF -DBUILD_QT5_TESTS=OFF -DBUILD_QT6_TESTS=OFF \
    -DBUILD_CPP_TESTS=OFF -DBUILD_MANUAL_TESTS=OFF -DENABLE_BOOST=OFF -DENABLE_CPP=OFF -DENABLE_GLIB=OFF \
    -DENABLE_GOBJECT_INTROSPECTION=OFF -DENABLE_GTK_DOC=OFF -DENABLE_QT5=OFF -DENABLE_QT6=OFF \
    -DENABLE_LIBOPENJPEG=openjpeg2 -DENABLE_CMS=none  -DBUILD_SHARED_LIBS=OFF && \
    make && \
    make install && cd /root && \
## Uninstall packages needed to compile poppler
    yum erase -y \
    cairo-devel \
    cmake \
    cmake3 \
    fontconfig-devel \
    gcc \
    gcc-c++ \
    libjpeg-devel \
    libpng-devel \
    libtiff-devel \
    make \
    tar \
    xz \
    zip && \
## Cleanup yum caches
    yum clean all  && \
    rm -rf /var/cache/yum

WORKDIR /var/task

# Image used in developement with development dependencies
FROM core as development

RUN cd lambda-complete && yarn install && cd .. && \
    cd lambda-configure && yarn install && cd .. && \
    cd lambda-convert && yarn install && cd .. && \
    cd lambda-medialive && yarn install && cd .. && \
    cd lambda-mediapackage && yarn install && cd .. && \
    cd lambda-elemental-routing && yarn install && cd .. && \
    cd lambda-migrate && yarn install && cd .. && \
    yarn cache clean

CMD [ "index.handler" ]

# Image used in production without development dependencies
FROM core as production

RUN cd lambda-complete && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-configure && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-convert && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-medialive && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-mediapackage && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-elemental-routing && yarn install --frozen-lockfile --production=true && cd .. && \
    cd lambda-migrate && yarn install --frozen-lockfile --production=true && cd .. && \
    yarn cache clean

CMD [ "index.handler" ]

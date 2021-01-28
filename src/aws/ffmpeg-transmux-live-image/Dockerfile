FROM jrottenberg/ffmpeg

RUN apt-get update && \
    apt-get install curl unzip -y && \
    apt-get clean

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install

WORKDIR /tmp/workdir
COPY entrypoint.sh /usr/local/bin

ENTRYPOINT [ "entrypoint.sh" ]

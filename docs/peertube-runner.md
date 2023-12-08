# PeerTube Runner

This document describes how to use [django-peertube-runner-connector](https://github.com/openfun/django-peertube-runner-connector) library in order to use a [PeerTube runner](https://docs.joinpeertube.org/admin/remote-runners) on Marsha. The goal is to replace the current AWS transcoding to use PeerTube runner hosted on your own infrastructure instead.

## Marsha integration

### The SocketIO problem

`django-peertube-runner-connector` is using the [socketIO](https://socket.io/) library. To make this works with Marsha, we needed to support its websocket endpoint, so we added this to the `websocket_urlpatterns`.


```Python
from django_peertube_runner_connector.socket import sio
from socketio import ASGIApp

websocket_urlpatterns += re_path(r"^socket.io/", ASGIApp(sio)),
```

Marsha is already using a websocket library and has a middleware verifying the JWT token in each websocket connection. So we needed to disable it for socket.io usage because our runner do not send the JWT token. It's a server to server connection.

```Python
# In case of a socket.io connection do not validate the token
if scope["path"] != "/socket.io/":
    token = self.validate_jwt(scope)
    scope["token"] = token
```

Doing this is enough to make PeerTube runner and Marsha work together without breaking change.

### Peertube Pipeline

In Marsha app, anything that should be done through Peertube runners should have the property `transcode_pipeline` set to `PEERTUBE`. Doing so, change the way video's urls are generated and enable the launch of transcoding jobs. Moreover, everything related to Peertube transcoding will use the [Scaleway](https://www.scaleway.com/en/object-storage/) object storage. The goal is to progressively use this new storage for any new video object.

### Storages

`django-peertube-runner-connector` uses [django-storages](https://django-storages.readthedocs.io/en/latest/) library to transcode and store videos. We take advantage of this library to store videos in different storage backends depending on our use case and environment.

In our case we need to set the `STORAGES["videos"]["BACKEND"]` setting with the right storage class, and the `STORAGE_BACKEND` setting with the right value. See [storage](#storage), to understand why we need this second setting.

#### S3VideoStorage

A storage used to store videos in a S3 like bucket. It can be used locally, and should be used in production.

```Python
STORAGES = {
    "videos": {
        "BACKEND": values.Value(
            "marsha.core.storage.s3.S3VideoStorage",
            environ_name="STORAGES_VIDEOS_BACKEND",
        ),
    },
}
# Should be used with this setting
STORAGE_BACKEND = values.Value("marsha.core.storage.s3")
```


#### FileSystemStorage

A storage used to store files in the local filesystem. It should only be used in development and use should use `VIDEO_ROOT` as location and base_url.

```Python
STORAGES = {
    "videos": {
        "BACKEND": values.Value(
            "django.core.files.storage.FileSystemStorage",
            environ_name="STORAGES_VIDEOS_BACKEND",
        ),
        "OPTIONS": values.DictValue(
            {
                "location": str(Base.VIDEOS_ROOT),
                "base_url": str(Base.VIDEOS_ROOT),
            },
            environ_name="STORAGES_VIDEOS_OPTIONS",
        ),
    },
}
# Should be used with this setting
STORAGE_BACKEND = values.Value("marsha.core.storage.filesystem")
```

#### TestStorage

A storage used to store videos in memory. Should be used in for tests to avoid undesirable files and speedup tests execution.

```Python
STORAGES = {
    "videos": {
        "BACKEND": "django.core.files.storage.InMemoryStorage",
    },
}
```

#### URLS

When a video object is returned to the client, it contains URLs to access the video playlist and mp4. These URLs are built in the video serializer. Before, they were manually created by combining the cloudfront domain and the video object key. It cannot work anymore because local files cannot be behind a cloudfront domain. BUT, we can simply make use `django-storages` and call the `video_storage.url(key)` method that will return the appropriate URL depending on the class used for videos.

### Callbacks

#### Upload ended

In the AWS pipeline, the client uploads a file on a source s3 bucket, then once the upload ended, it triggers a lambda function that will transcode the video and uploads the result in the destination s3 bucket. At every step, it call Marsha backend to update the video object. In Peertube pipeline, we don't use AWS to transcode the video, and we can't update the video object to  know if the upload ended or not. So, we created an `upload-ended` endpoint that will update the video object and trigger the peertube transcode pipeline.

#### Transcode ended

Once the transcode ended, the `django-peertube-runner-connector` will call the `TRANSCODING_VIDEO_IS_PUBLISHED_CALLBACK_PATH` function that will update the video object.

## Dev environment

### Runner

In a dev environment, our docker-compose uses as docker image that contains the peertube runner. It looks at the file `env.d/peertube_runner` for environment variables.

To communicate in a safe way, the runner and the server share a "runner token".
The following token is given in the env file:
```bash
PEERTUBE_RUNNER_REGISTERED_INSTANCE_URL=http://app:8000
PEERTUBE_RUNNER_REGISTERED_INSTANCE_RUNNER_TOKEN=ptrt-a8d27afb-ea3f-4746-9040-875a9b53f4d4
PEERTUBE_RUNNER_REGISTERED_INSTANCE_RUNNER_SECRET=local-peertube-runner
```

Using the command `make resetdb`, will reset the database and will create base dataset for the Marsha app. The data set also contains the runner token that is set by default in the env file.

Thus, doing `make resetdb` then `make run` should be enough to start the app and the peerTube runner, and both should communicate correctly.

### Storage

For dev purposes, we use the `FileSystemVideoStorage`, that can be used to store videos. It will stores files in the `media/videos` folder. This storage should be used with this setting:

```Python
STORAGE_BACKEND = values.Value("marsha.core.storage.filesystem")
```

This is because when we upload a video in S3, we create an presigned URL that we pass to the client, and this client will use this URL to upload the video.
If we don't want to use s3, we need to have an API endpoint to upload files. Putting "filesystem" in the `STORAGE_BACKEND` will enable the API, create the appropriate presigned URL (to our API) and serve files in the `media/videos` folder to be used by the client.

The possible values for `STORAGE_BACKEND` are:
- `marsha.core.storage.s3` (S3 process)
- `marsha.core.storage.filesystem` (local filesystem process)
- `marsha.core.storage.dummy` (testing purpose process)
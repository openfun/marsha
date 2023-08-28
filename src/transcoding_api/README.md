# Transcode API: an small API app to communicate with Peertube trandoding runners and transcode your videos

## Overview 
The Transcode API is designed to use Peertube transcoding runners outside of Peertube App. It implements a set of endpoints and a SocketIO server that allow runners to request jobs, updated job status, download media files and upload the transcoded media files. It provides two endpoints that can be used by users to transcode a given video.


## Architecture

The API in itself is separated in three parts.

### Runner API

This part will interact with Peertube runners. It is not designed to be used by a user as it reproduces what the Peertube App is doing in order to manage runners / jobs.


#### Runner Behaviour

Jobs are stored in a Database, and runners hit the `/request` endpoint to get the available jobs to transcode.


### Video API

This API provides endpoints transcode a video. Both endpoints works in the same way: it receives a video file and a name, and then creates transcoding jobs for it. The difference between the two endpoints is that one takes a File and the other takes a path to a file.

We use function `probe` of python-ffmpeg library, to get a thumbnail and all the necessary metadata to creates transcoding jobs. Once the jobs are created, the WebSocket server emits an event to inform runners of a new pending jobs.

The two endpoints available are: 

- `video/upload`: this endpoint takes a File and a name to transcode the given File
- `video/transcode`: this endpoint takes path and a name. It will then verify if the given the given file can be found a the path (see Storage section to know the path) abd create transcoding jobs for it.


### Job implementation

Currently we do not have use for every transcoding jobs the runner can do. We are planning to implements more jobs in the future. For now, the API only implements the following jobs:

- [x] HLS transcoding
- [ ] VOD web video transcoding
- [ ] Live transcoding
- [ ] VOD audio merge transcoding
- [ ] Video Studio transcoding

Theses jobs are created and handled through theirs respective classes in `api.transcoding.utils.job_handlers` directory. Some of them are already been implemented commented but are not used / tested.

### SocketIO server

The SocketIO server is used to communicate with runners. It is only used to inform runners of new jobs, thus, make this part very simple. It implements only one function that emits the event `available-jobs` to runners when a new job is created. Once a runner receives this event, it will hit the `/request` endpoint in the Runner API to get the new job.

## Setup

### Storage


## License


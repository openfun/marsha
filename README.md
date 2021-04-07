# Marsha, a self-hosted open source video and document provider 🐠

[![CircleCI](https://circleci.com/gh/openfun/marsha/tree/master.svg?style=svg)](https://circleci.com/gh/openfun/marsha/tree/master)

## Overview

`Marsha` is a video management & playback service. It is intended to be operated independently: it's like having your very own YouTube for education.

Marsha also supports hosting documents and distribute them on all your courses.

Instructors & organizations can use Marsha to upload and manage their videos (and associated files, such as subtitles or transcripts) or documents directly from a course as they are creating it.

Once the course is published, learners simply see a video player or documents in the course.

This seamless integration works with any LMS ([`Open edX`](https://open.edx.org), [`Moodle`](https://moodle.org), ...) thanks to the [LTI](https://en.wikipedia.org/wiki/Learning_Tools_Interoperability) standard for interoperability.

Here is what `Marsha` offers out of the box:

Video:

- automatic transcoding of videos to all suitable formats from a single video file uploaded by the instructor;
- adaptive-bitrate streaming playback (both HLS and DASH);
- accessibility through the player itself and support for subtitles, closed captions and transcripts;

Document:

- upload any type of documents;
- prevent disk storage quota by using AWS S3;

Moreover, Marsha provides:

- access control to resources through LTI authentication;
- easy deployment & management of environments through `Terraform`;

## Architecture

`Marsha` is made up of 3 building blocks: a **container-native** `Django` backend, an `AWS` transcoding and file storage environment, and a `React` frontend application.

### The `Django` backend

The `Django` backend is tasked with serving the LTI pages that are integrated into the LMS. It also manages all the objects with their relationships, user accounts and all authentication concerns. It exposes a JSON API to communicate with the part of the infrastructure that operates on `AWS lambdas` and the `React` frontend.

It is defined using a [docker-compose file](../docker-compose.yml) for development, and can be deployed on any container environment (such as `Kubernetes`) for production.

### The storage & transcoding environment

Source files (video, documents, subtitles,...) are directly uploaded to an `S3` bucket by instructors. Depending the uploaded resource a lambda will be triggered to do different jobs:
- Launch `MediaConvert` to generate all necessary video files (various formats and fragments & manifests for adaptive-bitrate streaming) into a destination `S3` bucket. Those files are then served through the `CloudFront` CDN.
- Convert any kind of subtitles (also captions and transcripts) in [WebVTT](https://www.w3.org/TR/webvtt1/) format and encode them properly.
- Resize thumbnails in many formats.
- Copy documents from a source to a destination `S3` Bucket accessible through the `CloudFront` CDN.

Lambdas are used to manage and monitor the process and report back to the `Django` backend.

This storage & transcoding environment requires `AWS` as it heavily relies on `AWS MediaConvert` to do the heavy lifting when it comes to transcoding. All the services it relies on are configured through `Terraform` and can be deployed effortlessly through a `make` command.

⚠️ **Privacy concerns**

Please note that the only objects we handle in `AWS` are the actual video, documents or subtitles files, from the upload to the distribution through transcoding and storage. It is not required to deploy any database or application backend to `AWS` or send any user's personal information there.

### The `React` frontend

The `React` frontend is responsible for the interfaces with which users interact in the LTI Iframes. It gets an authenticated token with permissions
from the view and interacts with the `Django` backend to manage objects and directly with `AWS s3` to upload files.

It also powers the same resource view when loaded by a learner to display a video player (thanks to [Plyr](https://plyr.io)) or a document reader.

⚠️ **Iframe management**

To have the best possible user experience for instructors, we need to be able to change the size of the `<iframe>` depending on its contents. This can be done through the [iframe-resizer](https://github.com/davidjbradshaw/iframe-resizer) library.

`iframe-resizer` requires to run some JS inside the `<iframe>` (which we include with our `React` frontend bundle) and some JS inside the host page. It then communicates through message-passing to adjust the size of the `<iframe>`.

This means that to have the best interfaces for instructors, you need to include the host-side `iframe-resizer` JS in your LMS pages. For Open edX, this is already done in our [custom LTI consumer Xblock](https://github.com/openfun/xblock-configurable-lti-consumer).

If you cannot or do not want to include this host-side JS, you can still run `Marsha`. It will work exactly the same for learners (provided you adjust the size of the LTI `<iframe>` for video), and instructors will only have to scroll inside the `<iframe>` on some occasions.

## Getting started

Make sure you have a recent version of Docker and
[Docker Compose](https://docs.docker.com/compose/install) installed on your laptop:

```bash
$ docker -v
  Docker version 19.03.6, build 369ce74a3c

$ docker-compose --version
  docker-compose version 1.24.1, build 4667896b
```

⚠️ You may need to run the following commands with `sudo` but this can be avoided by assigning your user to the `docker` group.

### The storage & transcoding environment

All tasks related to this environment are run from the `./src/aws` directory. We use `Terraform` to keep this infrastructure configuration as code and easily manage several independent deployments of the whole `AWS` infrastructure.

> Note for Mac users: Marsha's AWS development setup uses `getopt`. The version that comes with macOS is not suitable for our use case. You need to install the GNU version and add it to your path so it is used by default.
>
> `brew install gnu-getopt`
>
> `echo 'export PATH="/usr/local/opt/gnu-getopt/bin:$PATH"' >> ~/.zshrc`

There are 2 Terraform projects in Marsha with two different purposes:

- `./src/aws/shared_resources`: this project manages resources common to all marsha environments on the same AWS account. These resources must not live in different workspaces so you must work in the `default` workspace. To ease the use of this project, a dedicated script is available in `./src/aws/bin/shared-resources` which uses and configures the `Terraform` docker image. You have to run a Terraform command as if you were using the terraform cli. (eg: `./bin/shared-resources plan` will execute Terraform's "plan" command).
- `./src/aws`: this is the main project we use, most of the infrastructure is managed here (in all `*.tf` files). This project must use [`Terraform` workspaces](https://www.terraform.io/docs/state/workspaces.html) and we highly recommand you to not use the default one. With multiple workspaces, you can manage multiple environments for your Marsha instance with a single AWS account. To ease the use of this project, a dedicated script is available in `./src/aws/bin/terraform` which uses and configures the `Terraform` docker image. You have to run a Terraform command as if you were using the terraform cli. (eg: `./bin/terraform plan` will execute Terraform's "plan" command).

#### Terraform state management

Terraform manages a [state](https://www.terraform.io/docs/state/index.html) of your infrastructure. By default this state is stored locally on your machine but it is highly recommanded to use a [remote backend](https://www.terraform.io/docs/state/remote.html).

You will find all you need to configure a remote backend in the Terraform documentation: https://www.terraform.io/docs/configuration/blocks/backends/index.html

⚠ You must configure your state management before running any of the commands hereafter. The first `init` will initiate your state and after that you will have to deal with state migration if you want to modify it. You can create a file `src/aws/state.tf` and `src/aws/shared-resources/state.tf` to configure a backend, there is an example in each project (`state.tf.dist` file).

🔧 **Before you go further**, you need to create `./src/aws/env.d/development` and replace the relevant values with your own. You can take a look at the [environment documentation](https://github.com/openfun/marsha/blob/master/docs/env.md#2-environment-to-deploy-marsha-to-aws) for more details on this topic. You should use this command to create the file from the existing model:

    $ cp ./src/aws/env.d/development.dist ./src/aws/env.d/development

Initialize your `Terraform` config:

    $ cd src/aws
    $ make init

The `make init` command will also create an [ECR](https://aws.amazon.com/ecr/) repository. Before going further you have to build and publish the lambda docker image. Unfortunately AWS doesn't allow to use a public image, so you have to host this one on a private ECR instance. Copy the output of the `init` command, you will use them in the next step.

#### Build and publish the lambda image

For this step, we cooked a script to help you build, tag and deploy images. All the scripts are run from the marsha root directory.

🔧 **Before you go further**, you need to create `./env.d/lambda` and replace the relevant values with your own. The `ECR` url is available in the `shared_resources` terraform output you copied earlier. You should use this command to create the file from the existing model:

    $ cp ./env.d/lambda.dist ./env.d/lambda

You have to successively run these commands : 

Build the image:

    $ ./bin/lambda build

Tag the image:

    $ ./bin/lambda tag

And then publish it:

    $ ./bin/lambda publish

#### Apply all terraform plans

Terraform is split in two parts. The main one, directly in `src/aws` can work on multiple [`Terraform` workspaces](https://www.terraform.io/docs/state/workspaces.html). You will use this feature if you want separate environments (development, staging, preprod and production). We also need some resources available across all workspaces. For this we have an other terraform in `src/aws/shared_resources`.
To apply all plans at once run this command in the `src/aws` directory.

    $ make apply-all

Everything should be set up! You can check on your `AWS` management console.

You may have noticed that the `AWS` development environment requires a URL where the `Django` backend is running. You can easily get a URL that points to your locally running `Django` app using a tool such as [`ngrok`](https://ngrok.com).

### The `Django` Backend

All tasks related to the `Django` backend are run from the project root (where this `README.md` is located).

The easiest way to start working on the project is to use our `Makefile`:

    $ make bootstrap

This command builds the `app` container, installs back-end dependencies and performs database migrations. It's a good idea to use this command each time you are pulling code from the project repository to avoid dependency-related or migration-related issues.

🔧 **Before you go further**, you should take a look at the newly created `./env.d/development` file and replace the relevant values with your own. You can take a look at the [environment documentation](https://github.com/openfun/marsha/blob/master/docs/env.md#1-django-backend-environment) for more details on this topic.

Now that your `Docker` services are ready to be used, start the application by running:

    $ make run

You should be able to view the development view at [localhost:8060/development/](http://localhost:8060/development/).

### The `React` frontend

All tasks related to the `React` frontend are run from the `./src/frontend` directory.

We use `yarn` for all those tasks. Make sure you have a recent version installed:

```bash
$ yarn --version
  1.13.0
```

If you need to install `yarn`, please take a look at [the official documentation](https://yarnpkg.com/en/docs/install).

Install all the dependencies:

    $ yarn install

Run the build and copy the `iframe-resizer` host-side JS into your local `Django` assets:

    $ yarn build
    $ yarn copy-iframe-resizer

The front application is tested using [jest](https://jestjs.io/). Every js module has its corresponding spec file containing related tests:

```
├── VideoPlayer
│   ├── index.spec.tsx
│   ├── index.tsx
│   ├── indexWithDashjs.spec.tsx
│   └── VideoPlayer.css
```

Run the tests:

    $ yarn test

Browser testing provided by:

<a href="https://www.browserstack.com">
<img width="160" src="https://d29emq8to944i.cloudfront.net/static/browserstack/Browserstack-logo.svg" alt="BrowserStack"/>
</a>

🗝 **Before you go further**, you need to create a `Consumer Site` and `Passport` in Marsha's [admin panel](http://localhost:8060/admin/).

You should be all set to make the LTI request on the [development view](http://localhost:8060/development/) and access `Marsha`'s frontend interface!

## Contributing

This project is intended to be community-driven, so please, do not hesitate to get in touch if you
have any question related to our implementation or design decisions.

We try to raise our code quality standards and expect contributors to follow the recommandations
from our [handbook](https://openfun.gitbooks.io/handbook/content).

## License

This work is released under the MIT License (see [LICENSE](./LICENSE)).

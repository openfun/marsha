export class InvalidJitsiLiveException extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'InvalidJitsiLiveException';
  }
}

export class InvalidMedialiveEndpointsException extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'InvalidMedialiveEndpointsException';
  }
}

export class MissingVideoUrlsException extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'MissingVideoUrlsException';
  }
}

export class MissingSharedLiveSessionUrls extends Error {
  constructor(message: string) {
    super(message);

    this.name = 'MissingSharedLiveSessionUrls';
  }
}

// To use for default statement in switch where all cases must be covered
export class ShouldNotHappen extends Error {
  constructor(val: never) {
    super(`this should not happen: ${val as string}`);
  }
}

export interface IFetchResponseError<T = unknown> {
  code: string;
  status: number;
  response: Response;
  message: string;
  body?: T;
  detail?: string;
  errors?: { [key in keyof T]?: string[] }[];
}

export class FetchResponseError<T = unknown>
  extends Error
  implements IFetchResponseError<T>
{
  code: IFetchResponseError['code'];
  status: IFetchResponseError['status'];
  response: IFetchResponseError['response'];
  body?: IFetchResponseError<T>['body'];
  detail?: IFetchResponseError['detail'];
  errors?: IFetchResponseError<T>['errors'];
  error?: IFetchResponseError<T>;

  constructor(error: IFetchResponseError<T>) {
    super(error.message);

    this.name = 'FetchResponseError';
    this.body = error.body;
    this.error = error;
    this.code = error.code;
    this.status = error.status;
    this.response = error.response;
    this.detail = error.detail;
    this.message = error.message;
    this.errors = error.errors;
  }
}

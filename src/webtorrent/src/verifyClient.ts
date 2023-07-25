import { type IncomingMessage, type OutgoingHttpHeaders } from 'http';
import pkg from 'jsonwebtoken';
const { verify } = pkg;

const jwtSecretKey = process.env.JWT_SIGNING_KEY ?? '';

type callbackVerifyClient = (res: boolean, code?: number, message?: string, headers?: OutgoingHttpHeaders) => void;

export const verifyClient = (info: {
  origin: string
  secure: boolean
  req: IncomingMessage
}, call: callbackVerifyClient): void => {
  const url = info.req.url;
  if (url === undefined) {
    call(false, 401, 'Unauthorized');
    return;
  }

  const parsedUrl = new URL(url, `http://${info.req.headers.host ?? 'localhost'}`);
  const token = parsedUrl.searchParams.get('token');
  if (token === null) {
    call(false, 401, 'Unauthorized');
    return;
  }

  verify(token, jwtSecretKey, (err, decoded) => {
    if (err !== null) {
      call(false, 401, 'Unauthorized');
    } else {
      call(true);
    }
  });
};

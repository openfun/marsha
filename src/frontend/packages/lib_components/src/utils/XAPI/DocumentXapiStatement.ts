import { Document } from 'types';

import {
  ContextDocumentExtensionsDefinition,
  DataPayload,
  DocumentXapiStatementInterface,
  VerbDefinition,
  XapiResourceType,
} from 'types/XAPI';

import { sendXAPIStatement } from './sendXAPIStatement';

export class DocumentXapiStatement implements DocumentXapiStatementInterface {
  constructor(
    private jwt: string,
    private sessionId: string,
    private documentId: Document['id'],
  ) {}

  downloaded(): void {
    const data: DataPayload = {
      context: {
        extensions: {
          [ContextDocumentExtensionsDefinition.sessionId]: this.sessionId,
        },
      },
      verb: {
        display: {
          'en-US': 'downloaded',
        },
        id: VerbDefinition.downloaded,
      },
    };

    this.send(data);
  }

  private send(data: DataPayload) {
    sendXAPIStatement(
      data,
      this.jwt,
      XapiResourceType.DOCUMENT,
      this.documentId,
    );
  }
}

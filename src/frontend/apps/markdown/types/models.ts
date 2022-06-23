import { Playlist, Resource } from 'types/tracks';

export enum modelName {
  MARKDOWN_DOCUMENTS = 'markdown-documents',
}

export interface MarkdownDocumentRenderingOptions {
  useMdx?: boolean;
  useMathjax?: boolean;
}

export interface MarkdownDocumentTranslation {
  language_code: string;
  title: string;
  content: string;
  rendered_content: string;
}

export interface MarkdownDocument extends Resource {
  playlist: Playlist;
  lti_url: string;
  is_draft: boolean;
  rendering_options: MarkdownDocumentRenderingOptions;
  translations: MarkdownDocumentTranslation[];
}

// React queries
export interface MarkdownSaveTranslationsRequest {
  language_code: string;
  title: string;
  content: string;
  rendered_content: string;
}
// tslint:disable-next-line:no-empty-interface
export interface MarkdownSaveTranslationsResponse extends MarkdownDocument {}

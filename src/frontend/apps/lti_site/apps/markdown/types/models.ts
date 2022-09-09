import { Playlist, Resource, uploadState } from 'types/tracks';
import { Nullable } from 'utils/types';

export enum modelName {
  MARKDOWN_DOCUMENTS = 'markdown-documents',
  MARKDOWN_IMAGES = 'markdown-images',
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
  images: MarkdownImage[];
}

export interface MarkdownImage extends Resource {
  active_stamp: Nullable<number>;
  markdown_document: string;
  filename: Nullable<string>;
  is_ready_to_show: boolean;
  upload_state: uploadState;
  url: Nullable<string>;
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

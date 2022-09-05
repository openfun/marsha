type MarkdownImageCacheEntry = {
  url: string;
  expiration: number;
};

export type MarkdownImageCache = { [id: string]: MarkdownImageCacheEntry };

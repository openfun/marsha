import { Nullable } from 'lib-common';
import create from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import { modelName as markdownModelName } from 'apps/markdown/types/models';
import { StoreState } from 'types/stores';
import { MarkdownImage } from 'apps/markdown/types/models';

type MarkdownImageStateResource = {
  [markdownModelName.MARKDOWN_IMAGES]: {
    [id: string]: MarkdownImage;
  };
};

type MarkdownImageState = StoreState<MarkdownImage> &
  MarkdownImageStateResource & {
    getMarkdownImage: () => Nullable<MarkdownImage>;
  };

export const useMarkdownImage = create<MarkdownImageState>((set, get) => {
  return {
    addMultipleResources: (markdownImagetoAdd: MarkdownImage[]) =>
      set(
        addMultipleResources(
          get(),
          markdownModelName.MARKDOWN_IMAGES,
          markdownImagetoAdd,
        ) as MarkdownImageStateResource,
      ),
    addResource: (markdownImage: MarkdownImage) =>
      set(
        addResource<MarkdownImage>(
          get(),
          markdownModelName.MARKDOWN_IMAGES,
          markdownImage,
        ) as MarkdownImageStateResource,
      ),
    getMarkdownImage: () => {
      if (Object.keys(get()[markdownModelName.MARKDOWN_IMAGES]).length > 0) {
        const markdownImageId = Object.keys(
          get()[markdownModelName.MARKDOWN_IMAGES],
        ).shift();
        return get()[markdownModelName.MARKDOWN_IMAGES][markdownImageId!];
      }

      return null;
    },
    removeResource: (markdownImage: MarkdownImage) =>
      set(
        removeResource(
          get(),
          markdownModelName.MARKDOWN_IMAGES,
          markdownImage,
        ) as MarkdownImageStateResource,
      ),
    [markdownModelName.MARKDOWN_IMAGES]: {},
  };
});

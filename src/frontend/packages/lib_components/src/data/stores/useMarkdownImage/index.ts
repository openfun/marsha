import { Nullable } from 'lib-common';
import { create } from 'zustand';

import {
  addMultipleResources,
  addResource,
  removeResource,
} from 'data/stores/actions';
import {
  MarkdownImage,
  MarkdownDocumentModelName,
} from 'types/apps/markdown/models';
import { StoreState } from 'types/stores';

type MarkdownImageStateResource = {
  [MarkdownDocumentModelName.MARKDOWN_IMAGES]: {
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
          MarkdownDocumentModelName.MARKDOWN_IMAGES,
          markdownImagetoAdd,
        ) as MarkdownImageStateResource,
      ),
    addResource: (markdownImage: MarkdownImage) =>
      set(
        addResource<MarkdownImage>(
          get(),
          MarkdownDocumentModelName.MARKDOWN_IMAGES,
          markdownImage,
        ) as MarkdownImageStateResource,
      ),
    getMarkdownImage: () => {
      if (
        Object.keys(get()[MarkdownDocumentModelName.MARKDOWN_IMAGES]).length > 0
      ) {
        const markdownImageId = Object.keys(
          get()[MarkdownDocumentModelName.MARKDOWN_IMAGES],
        ).shift() as string;
        return get()[MarkdownDocumentModelName.MARKDOWN_IMAGES][
          markdownImageId
        ];
      }

      return null;
    },
    removeResource: (markdownImage: MarkdownImage) =>
      set(
        removeResource(
          get(),
          MarkdownDocumentModelName.MARKDOWN_IMAGES,
          markdownImage,
        ) as MarkdownImageStateResource,
      ),
    [MarkdownDocumentModelName.MARKDOWN_IMAGES]: {},
  };
});

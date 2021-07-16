import React from 'react';
import { Video, videoSize } from '../../../types/tracks';
import { Document } from '../../../types/file';
import { Image } from 'grommet';
import styled from 'styled-components';

const IconBox = styled.span`
  font-size: 70px;
  text-align: center;
  padding: 40px;
`;

/** Props shape for the ResourceThumbnail component. */
interface ResourceThumbnailProps {
  resource: Video | Document;
}

/** Component. Displays a thumbnail for an resource.
 * @param resource The video or document for which the thumbnail is displayed.
 */

export const ResourceThumbnail = ({ resource }: ResourceThumbnailProps) => {
  let thumbnail;
  if ('thumbnail' in resource || 'urls' in resource) {
    const thumbnailUrls =
      (resource.thumbnail &&
        resource.thumbnail.is_ready_to_show &&
        resource.thumbnail.urls) ||
      resource.urls?.thumbnails;

    if (thumbnailUrls) {
      const resolutions = Object.keys(thumbnailUrls).map(
        (size) => Number(size) as videoSize,
      );
      thumbnail =
        thumbnailUrls && resolutions
          ? thumbnailUrls[resolutions[0]]
          : undefined;
    }
  }

  return (
    <React.Fragment>
      {thumbnail ? (
        <Image
          alignSelf="stretch"
          alt={resource.title}
          fit="cover"
          fill="vertical"
          src={thumbnail}
        />
      ) : (
        <IconBox className="icon-file-text2" />
      )}
    </React.Fragment>
  );
};

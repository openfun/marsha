/* eslint-disable react/no-unescaped-entities */
/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { createDtWithFiles, createFile, render } from 'lib-tests';
import React from 'react';

import { MarkdownImageDropzone } from '.';

describe('<MarkdownImageDropzone />', () => {
  const ChildElement = () => {
    return <div>I'm the children</div>;
  };

  const catFile = createFile('cats.gif', 1234, 'image/gif');
  const kittenFile = createFile('kitten.png', 1234, 'image/png');
  const dogFile = createFile('dogs.pdf', 1234, 'application/pdf');

  it('reacts only to accepted files (images)', async () => {
    const onDropAccepted = jest.fn();

    const { container } = render(
      <MarkdownImageDropzone onDropAccepted={onDropAccepted}>
        <ChildElement />
      </MarkdownImageDropzone>,
    );

    const dropzoneInput = container.getElementsByTagName('input')[0];
    expect(dropzoneInput).toHaveAttribute(
      'accept',
      'image/bmp,.bmp,image/gif,.gif,image/jpeg,.jpeg,.jpg,image/png,.png,image/svg+xml,.svg,image/tiff,.tiff,image/webp,.webp',
    );
    expect(screen.getByText("I'm the children")).toBeVisible();

    // Dragging an image
    fireEvent.dragEnter(dropzoneInput, createDtWithFiles([catFile]));
    await waitFor(() =>
      expect(
        screen.getByText('Release to insert image in document'),
      ).toBeVisible(),
    );

    // Dragging anything but an image
    fireEvent.dragEnter(dropzoneInput, createDtWithFiles([dogFile]));
    await waitFor(async () =>
      expect(
        await screen.findByText('Release to insert image in document'),
      ).not.toBeVisible(),
    );

    expect(onDropAccepted).not.toHaveBeenCalled();
  });

  it('uploads images', async () => {
    const onDropAccepted = jest.fn();

    const { container } = render(
      <MarkdownImageDropzone onDropAccepted={onDropAccepted}>
        <ChildElement />
      </MarkdownImageDropzone>,
    );

    const dropzoneInput = container.getElementsByTagName('input')[0];

    // Drop anything but an image
    fireEvent.drop(dropzoneInput, createDtWithFiles([dogFile]));

    expect(onDropAccepted).not.toHaveBeenCalled();

    // Drop an image
    fireEvent.drop(dropzoneInput, createDtWithFiles([catFile]));

    await waitFor(() => expect(onDropAccepted).toHaveBeenCalledTimes(1));
    expect(onDropAccepted).toHaveBeenCalledWith([catFile], expect.anything());

    // Drop many images
    jest.resetAllMocks();
    fireEvent.drop(dropzoneInput, createDtWithFiles([catFile, kittenFile]));

    await waitFor(() => expect(onDropAccepted).toHaveBeenCalledTimes(1));
    expect(onDropAccepted).toHaveBeenCalledWith(
      [catFile, kittenFile],
      expect.anything(),
    );

    // Drop image and other file
    jest.resetAllMocks();
    fireEvent.drop(dropzoneInput, createDtWithFiles([dogFile, kittenFile]));

    await waitFor(() => expect(onDropAccepted).toHaveBeenCalledTimes(1));
    expect(onDropAccepted).toHaveBeenCalledWith(
      [kittenFile],
      expect.anything(),
    );
  });
});

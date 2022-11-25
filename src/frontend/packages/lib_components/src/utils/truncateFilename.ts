export const truncateFilename = (
  filename: string | null,
  maxLength: number,
) => {
  const ELLIPSIS = '[…]';

  if (!filename) {
    return '';
  }

  if (filename.length <= maxLength || maxLength <= ELLIPSIS.length) {
    return filename;
  }

  let extension = '';
  const splittedFilename = filename.split('.');
  if (splittedFilename.length > 1) {
    extension = `.${splittedFilename.pop() || ''}`;
  }
  const truncated = filename.substring(
    0,
    maxLength - extension.length - ELLIPSIS.length,
  );
  return `${truncated}${ELLIPSIS}${extension}`;
};

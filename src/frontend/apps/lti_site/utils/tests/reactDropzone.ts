// These helpers have been copy/pasted from the react-dropzone github repository
// https://github.com/react-dropzone/react-dropzone/blob/a2039fd4bc5430a166858d71b7499a17036e68f9/src/index.spec.js

/**
 * createFile creates a mock File object
 */
export function createFile(name: string, size: number, type: string) {
  const file = new File([], name, { type });
  Object.defineProperty(file, 'size', {
    get() {
      return size;
    },
  });
  return file;
}

/**
 * createDtWithFiles creates a mock data transfer object that can be used for drop events
 */
export function createDtWithFiles(files: File[] = []) {
  return {
    dataTransfer: {
      files,
      items: files.map((file) => ({
        kind: 'file',
        size: file.size,
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
  };
}

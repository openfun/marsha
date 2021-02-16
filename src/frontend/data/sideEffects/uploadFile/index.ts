/**
 * Upload a file, using XHR so we can report on progress through a handler.
 * @param url The URL to POST the file to.
 * @param formData The multi-part request form data body to send (includes the file).
 * @param progressHandler A handler that receives progress updates as a single integer `0 <= x <= 100`.
 */
export const uploadFile = (
  url: string,
  formData: FormData,
  progressHandler: (progress: number) => void,
) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.addEventListener('error', reject);
    xhr.addEventListener('abort', reject);

    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 204) {
          return resolve(true);
        }
        reject(new Error(`Failed to perform the upload on ${url}.`));
      }
    });

    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (progressEvent.lengthComputable) {
        progressHandler(
          Math.floor((progressEvent.loaded / progressEvent.total) * 100),
        );
      }
    });

    xhr.send(formData);
  });

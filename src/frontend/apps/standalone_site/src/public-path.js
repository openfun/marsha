document.addEventListener('DOMContentLoaded', () => {
  // Find the `public-path` meta tag. The value attribute contains the
  // static base url. This path is then used by webpack to build the static
  // urls. By convention this static base url always has a trailing slash.
  const metaPublicPath = document.querySelector('meta[name="public-path"]');

  if (metaPublicPath) {
    const metaPublicPathValue = metaPublicPath.getAttribute('value') || '';
    if (
      metaPublicPathValue &&
      metaPublicPathValue !== '{{ static_base_url }}'
    ) {
      __webpack_public_path__ = `${metaPublicPath.getAttribute('value') || ''}`;
    }
  }
});

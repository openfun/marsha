/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface Window extends Window {
  __toCdnUrl: (importer: string) => string;
}

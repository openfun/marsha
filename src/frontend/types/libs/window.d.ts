// Ensure this is treated as a module.
export {};

declare global {
  interface Window {
    converse: {
      initialize: (options: any) => void;
    };
  }
}

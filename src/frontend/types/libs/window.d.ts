// Ensure this is treated as a module.
export {};

declare global {
  interface Window {
    converse: {
      plugins: {
        add: (name: string, {}: any) => void;
      };
      initialize: (options: any) => void;
    };
  }
}

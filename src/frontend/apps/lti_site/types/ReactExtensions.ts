import * as _React from 'react';

// Extend the type definition for <source> HTML/JSX elements to allow us to add a "size" attribute
// that is used by Plyr for its source selector UI.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SourceHTMLAttributes<T> {
    size?: string;
  }
}

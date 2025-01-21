import React, { JSX, PropsWithChildren, createContext, useState } from 'react';

export interface Crumb {
  key: string;
  title: JSX.Element | string;
  url: string;
}

export const BreadCrumbsContext = createContext<
  [Crumb[], React.Dispatch<React.SetStateAction<Crumb[]>>]
>([
  [],
  () => {
    throw new Error('BreadCrumbsContext not wrapped in a BreadCrumbsProvider');
  },
]);

/**
 * Wraps the app and allows our breadcrumbs components to work together
 */
export const BreadCrumbsProvider = ({
  children,
}: PropsWithChildren<unknown>) => {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  return (
    <BreadCrumbsContext.Provider value={[crumbs, setCrumbs]}>
      {children}
    </BreadCrumbsContext.Provider>
  );
};

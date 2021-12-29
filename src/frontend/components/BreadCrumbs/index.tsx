import { Box } from 'grommet';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

interface Crumb {
  key: string;
  title: JSX.Element | string;
  url: string;
}

const BreadCrumbsContext = createContext<
  [Crumb[], React.Dispatch<React.SetStateAction<Crumb[]>>]
>([[], () => {}]);

/**
 * Wraps the app and allows our breadcrumbs components to work together
 */
export const BreadCrumbsProvider: React.FC = ({ children }) => {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);

  return (
    <BreadCrumbsContext.Provider value={[crumbs, setCrumbs]}>
      {children}
    </BreadCrumbsContext.Provider>
  );
};

const BreadCrumbLink = styled(Link)`
  color: black;
  text-decoration: underline;

  &:hover {
    text-decoration: none;
  }
`;

/**
 * Display all current breadcrumbs entries as generated from the `<Crumbs />`.
 * NB: needs to be inside a `<BreadCrumbsProvider />`.
 */
export const BreadCrumbs: React.FC = () => {
  const [crumbs] = useContext(BreadCrumbsContext);

  const orderedCrumbs = crumbs.sort(
    (crumbA, crumbB) => crumbA.url.length - crumbB.url.length,
  );

  return (
    <Box as="ul" direction="row" margin="none" pad="medium" gap="medium">
      {orderedCrumbs.map((crumb, index, list) => (
        <Box as="li" key={crumb.key}>
          {index === list.length - 1 ? (
            crumb.title
          ) : (
            <Box direction="row" gap="medium">
              <BreadCrumbLink to={crumb.url}>{crumb.title}</BreadCrumbLink>
              <span aria-hidden="true">{'>'}</span>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

interface CrumbProps {
  title: Crumb['title'];
}

/**
 * Add an entry to the breadcrumbs from anywhere in the React tree.
 * Thanks to react-router, crumbs know where they sit in the tree as they can get their own url themselves.
 * NB: needs to be inside a `<BreadCrumbsProvider />`.
 * @param title The title for the entry to be displayed in the breadcrumbs.
 */
export const Crumb: React.FC<CrumbProps> = ({ title }) => {
  const key = uuidv4();
  const { pathname } = useLocation();
  const [_, setCrumbs] = useContext(BreadCrumbsContext);

  useEffect(() => {
    setCrumbs((crumbs) => [
      ...crumbs.filter((currentCrumb) => currentCrumb.key !== key),
      { key, title, url: pathname },
    ]);

    return () => {
      setCrumbs((crumbs) =>
        crumbs.filter((currentCrumb) => currentCrumb.key !== key),
      );
    };
  }, [title]);

  return null;
};

import { Box } from 'grommet';
import { BreadCrumbsContext, Crumb as CrumbType } from 'lib-common';
import React, { useContext, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

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
  title: CrumbType['title'];
}

/**
 * Add an entry to the breadcrumbs from anywhere in the React tree.
 * Thanks to react-router, crumbs know where they sit in the tree as they can get their own url themselves.
 * NB: needs to be inside a `<BreadCrumbsProvider />`.
 * @param title The title for the entry to be displayed in the breadcrumbs.
 */
export const Crumb: React.FC<CrumbProps> = ({ title }) => {
  const key = useMemo(() => uuidv4(), []);
  const { pathname } = useLocation();
  const [_, setCrumbs] = useContext(BreadCrumbsContext);

  useEffect(() => {
    setCrumbs((crumbs) => [...crumbs, { key, title, url: `${pathname}/../` }]);

    return () => {
      setCrumbs((crumbs) =>
        crumbs.filter((currentCrumb) => currentCrumb.key !== key),
      );
    };
  }, [key, setCrumbs, title, pathname]);

  return null;
};

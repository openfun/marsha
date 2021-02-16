import React, { FC } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { withRouter } from 'react-router';

interface WithLinkprops {
  to: string;
}

/** Wraps a component to allow it to link to a view using react-router.
 * Uses react-router "history" to ensure the app state remains consistent.
 * @param WrappedComponent the component to add a link to.
 * @returns a wrapper which takes the same props as the Wrapped component, plus `to` as a link destination.
 */
export function withLink<P extends object>(
  WrappedComponent: React.ComponentType<P & React.DOMAttributes<any>>,
) {
  const wrapper: FC<P & WithLinkprops> = (wrapperProps) => {
    const InnerWrapper = withRouter((props) => (
      <WrappedComponent
        {...wrapperProps}
        onClick={() => props.history.push(wrapperProps.to)}
      />
    ));
    return <InnerWrapper />;
  };

  return wrapper;
}

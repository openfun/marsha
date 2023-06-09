import * as React from 'react';
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
  WrappedComponent: React.ComponentType<P & WithLinkprops>,
) {
  const LinkedComponent = (props: P & WithLinkprops) => {
    const InnerWrapper = withRouter((routerProps) => (
      <WrappedComponent
        {...props}
        onClick={() => routerProps.history.push(props.to)}
      />
    ));
    return <InnerWrapper />;
  };
  return LinkedComponent;
}

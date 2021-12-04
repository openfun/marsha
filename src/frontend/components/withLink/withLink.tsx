import * as React from 'react';
import { useNavigate } from 'react-router';

interface WithLinkprops {
  to: string;
}

/** Wraps a component to allow it to link to a view using react-router.
 * Uses react-router "history" to ensure the app state remains consistent.
 * @param WrappedComponent the component to add a link to.
 * @returns a wrapper which takes the same props as the Wrapped component, plus `to` as a link destination.
 */
/*
export function withLink<P extends object>(
  WrappedComponent: React.ComponentType<P & React.DOMAttributes<any>>,
) {
  return class extends React.Component<P & WithLinkprops> {
    render() {
      const InnerWrapper = withRouter((props) => (
        <WrappedComponent
          {...this.props}
          onClick={() => props.history.push(this.props.to)}
        />
      ));
      return <InnerWrapper />;
    }
  };
}
*/

export function withLink<P extends object>(
  WrappedComponent: React.ComponentType<P & React.DOMAttributes<any>>,
)  {
  return (props: P & WithLinkprops) => {
    const navigate = useNavigate();

    return <WrappedComponent {...props } onclick={() => navigate(props.to)} />

  }
}
import React from 'react';

import { Loader } from '../Loader';

/** Available icon names for statusIcon on the UploadStatus component. */
export enum statusIconKey {
  LOADER = 'loader',
  TICK = 'tick',
  X = 'x',
}

/** Props shape for the UploadStatus component. */
export interface UploadStatusProps {
  children: React.ReactNode;
  className?: string;
  statusIcon?: statusIconKey;
}

/** Component. Displays one word status information along with an optional icon.
 * @param statusIcon The key for an icon to display along with the status.
 */
export const UploadStatus = ({
  children,
  className,
  statusIcon,
}: UploadStatusProps) => {
  let icon;
  switch (statusIcon) {
    case statusIconKey.LOADER:
      icon = <Loader />;
      break;

    case statusIconKey.TICK:
      icon = '✔️';
      break;

    case statusIconKey.X:
      icon = '❌';
      break;
  }

  return (
    <div className={className || ''}>
      {children}
      &nbsp;
      {icon}
    </div>
  );
};

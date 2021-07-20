import { ButtonProps } from 'grommet';
import React, { MouseEventHandler, useState } from 'react';
import { ConfirmationLayer } from '../ConfirmationLayer';
import { DashboardButton } from '../DashboardPaneButtons';

interface DashboardConfirmButtonProps extends ButtonProps {
  confirmationLabel: JSX.Element | string;
  onConfirm: MouseEventHandler;
}

export const DashboardConfirmButton = ({
  confirmationLabel,
  onConfirm,
  ...buttonProps
}: DashboardConfirmButtonProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const requireConfirmAction = () => {
    setShowConfirm(true);
  };

  const onConfirmAction = (e: React.MouseEvent<Element, MouseEvent>) => {
    setShowConfirm(false);
    onConfirm(e);
  };

  return (
    <React.Fragment>
      <DashboardButton
        primary={true}
        onClick={requireConfirmAction}
        {...buttonProps}
      />
      {showConfirm && (
        <ConfirmationLayer
          confirmationLabel={confirmationLabel}
          onCancel={() => setShowConfirm(false)}
          onConfirm={onConfirmAction}
        />
      )}
    </React.Fragment>
  );
};

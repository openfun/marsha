import React, { MouseEventHandler, useState } from 'react';
import { ConfirmationLayer } from '../ConfirmationLayer';
import { DashboardButton } from '../DashboardPaneButtons';

interface DashboardConfirmButtonProps {
  label: JSX.Element;
  confirmationLabel: JSX.Element;
  onConfirm: MouseEventHandler;
}

export const DashboardConfirmButton = ({
  label,
  confirmationLabel,
  onConfirm,
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
        label={label}
        primary={true}
        onClick={requireConfirmAction}
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

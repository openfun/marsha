import { Box, Button, Layer, LayerProps } from 'grommet';
import { Nullable } from 'lib-common';
import { ExitCrossSVG } from 'lib-components';
import {
  forwardRef,
  MutableRefObject,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  closeButtonTitle: {
    defaultMessage: 'Close the modale',
    description: 'Accessibility title for close modale button title.',
    id: 'components.Modale.closeButtonTitle',
  },
});

export interface ModalControlMethods {
  open: () => void;
  close: () => void;
}

interface ModalProps extends Omit<LayerProps, 'onClickOutside' | 'onEsc'> {
  isOpen?: boolean;
  controlMethods?: MutableRefObject<Nullable<ModalControlMethods>>;
  onClose?: () => void;
}

/**
 * The Modal component is used to present content over the current document.
 * This component can be controled or uncontroled, and add a button on the top right corner to close the Modal.
 * Props:
 *  - isOpen : use it to control wether the Modal is open or not
 *  - controlMethods : the Modal will inject in the ref methods to programmatically open or close the Modal
 *  - onClose : callback called when the Modal is closed, unless it is closed due to isOpen set to false
 *  - any other props of Grommet's Layer but onClickOutside and onEsc
 * You can also use a ref on the Modal to target the underlaying Layer Component.
 */
const Modal = forwardRef<
  Nullable<HTMLDivElement>,
  PropsWithChildren<ModalProps>
>((props, ref) => {
  const {
    controlMethods,
    isOpen: initialIsOpen,
    children,
    onClose,
    ...layerProps
  } = props;

  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(initialIsOpen || false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (initialIsOpen === undefined) {
      return;
    }

    setIsOpen(initialIsOpen);
  }, [initialIsOpen]);

  useEffect(() => {
    if (!controlMethods) {
      return;
    }

    controlMethods.current = {
      open: () => {
        setIsOpen(true);
      },
      close: () => {
        setIsOpen(false);
      },
    };
  }, [controlMethods]);

  if (!isOpen) {
    return null;
  }

  return (
    <Layer
      ref={ref}
      onEsc={handleClose}
      onClickOutside={handleClose}
      animation="fadeIn"
      {...layerProps}
    >
      <Box style={{ position: 'absolute', right: '0' }}>
        <Button
          a11yTitle={intl.formatMessage(messages.closeButtonTitle)}
          margin={{ left: 'auto' }}
          onClick={handleClose}
        >
          <ExitCrossSVG height="36px" width="36px" iconColor="blue-active" />
        </Button>
      </Box>
      {children}
    </Layer>
  );
});

Modal.displayName = 'Modal';
export default Modal;

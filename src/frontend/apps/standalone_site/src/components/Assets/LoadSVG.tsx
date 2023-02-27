import { SVGProps } from 'react';
import { useIntl } from 'react-intl';

type LoadSVGProps = SVGProps<SVGSVGElement> & {
  Icon: React.FC<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
    }
  >;
  title: {
    defaultMessage: string;
    description: string;
    id: string;
  };
};

const LoadSVG = ({ Icon, title, ...props }: LoadSVGProps) => {
  const intl = useIntl();
  return (
    <Icon
      width={props.width || 30}
      height={props.height || 30}
      role="img"
      title={intl.formatMessage(title)}
      {...props}
    />
  );
};

export default LoadSVG;

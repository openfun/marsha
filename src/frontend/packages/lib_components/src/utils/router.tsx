import { ReactElement } from 'react';
import { Params, useParams } from 'react-router-dom';

interface WrappersParamProps {
  children: (param: Readonly<Params<string>>) => ReactElement;
}

export const WithParams = ({ children }: WrappersParamProps) => {
  const params = useParams();
  return children(params);
};

import { ROOT_APP } from 'conf/global';

import { getMetaPublicValue } from './dom';

describe('dom', () => {
  it('tests getMetaPublicValue with public-path empty', () => {
    expect(getMetaPublicValue()).toEqual(ROOT_APP);
  });

  it('tests getMetaPublicValue with public-path', () => {
    const publicPath = '//test.net/static/js/build/site/';
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'public-path');
    meta.setAttribute('value', publicPath);
    meta.setAttribute('data-testid', 'public-path-id');
    document.head.appendChild(meta);

    expect(getMetaPublicValue()).toEqual(publicPath);
  });
});

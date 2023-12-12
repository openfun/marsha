import { ROOT_APP } from 'conf/global';

import { getMetaPublicValue } from './dom';

describe('dom', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('tests getMetaPublicValue with public-path empty', () => {
    expect(getMetaPublicValue('/__static_base_url__/')).toEqual(ROOT_APP);
  });

  it('tests getMetaPublicValue with public-path', () => {
    const publicPath = '//test.net/static/js/build/site/';
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'public-path');
    meta.setAttribute('value', publicPath);
    document.head.appendChild(meta);

    expect(getMetaPublicValue('/__static_base_url__/')).toEqual(publicPath);
  });

  it('tests getMetaPublicValue with public-path same as keyword', () => {
    const publicPath = '/__static_base_url__/';
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'public-path');
    meta.setAttribute('value', publicPath);
    document.head.appendChild(meta);

    expect(getMetaPublicValue(publicPath)).toEqual(ROOT_APP);
  });
});

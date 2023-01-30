import { escapeMarkdown } from './escapeMarkdown';

describe('escapeMarkdown', () => {
  it('escapes asterisks', () => {
    expect(escapeMarkdown('some text with *')).toEqual('some text with \\*');
  });
  it('escapes hashtag', () => {
    expect(escapeMarkdown('some text with #')).toEqual('some text with \\#');
  });
  it('escapes slashes', () => {
    expect(escapeMarkdown('some text with /')).toEqual('some text with \\/');
  });
  it('escapes opening parenthesis', () => {
    expect(escapeMarkdown('some text with (')).toEqual('some text with \\(');
  });
  it('escapes closing parenthesis', () => {
    expect(escapeMarkdown('some text with )')).toEqual('some text with \\)');
  });
  it('escapes opening square bracket', () => {
    expect(escapeMarkdown('some text with [')).toEqual('some text with \\[');
  });
  it('escapes closing square bracket', () => {
    expect(escapeMarkdown('some text with ]')).toEqual('some text with \\]');
  });
  it('escapes opening angle bracket', () => {
    expect(escapeMarkdown('some text with <')).toEqual('some text with \\<');
  });
  it('escapes closing angle bracket', () => {
    expect(escapeMarkdown('some text with >')).toEqual('some text with \\>');
  });
  it('escapes underscore', () => {
    expect(escapeMarkdown('some text with _')).toEqual('some text with \\_');
  });
});

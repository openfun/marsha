import { escapeMarkdown } from './escapeMarkdown';

describe('escapeMarkdown', () => {
  it('escapes asterisks', async () => {
    expect(escapeMarkdown('some text with *')).toEqual('some text with \\*');
  });
  it('escapes hashtag', async () => {
    expect(escapeMarkdown('some text with #')).toEqual('some text with \\#');
  });
  it('escapes slashes', async () => {
    expect(escapeMarkdown('some text with /')).toEqual('some text with \\/');
  });
  it('escapes opening parenthesis', async () => {
    expect(escapeMarkdown('some text with (')).toEqual('some text with \\(');
  });
  it('escapes closing parenthesis', async () => {
    expect(escapeMarkdown('some text with )')).toEqual('some text with \\)');
  });
  it('escapes opening square bracket', async () => {
    expect(escapeMarkdown('some text with [')).toEqual('some text with \\[');
  });
  it('escapes closing square bracket', async () => {
    expect(escapeMarkdown('some text with ]')).toEqual('some text with \\]');
  });
  it('escapes opening angle bracket', async () => {
    expect(escapeMarkdown('some text with <')).toEqual('some text with \\<');
  });
  it('escapes closing angle bracket', async () => {
    expect(escapeMarkdown('some text with >')).toEqual('some text with \\>');
  });
  it('escapes underscore', async () => {
    expect(escapeMarkdown('some text with _')).toEqual('some text with \\_');
  });
});

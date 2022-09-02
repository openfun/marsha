export const escapeMarkdown = (stringToEscape: string) => {
  return stringToEscape.replace(/[*#\/()\[\]<>_]/g, '\\$&');
};

export const isLocalStorageEnabled = (): boolean => {
  try {
    localStorage.setItem('enabled', '1');
    localStorage.removeItem('enabled');
    return true;
  } catch (e) {
    return false;
  }
};

import { ResetPasswordError } from './api/resetPassword';

const isStringArray = (value: unknown): value is string[] => {
  if (value === undefined || value === null || !Array.isArray(value)) {
    return false;
  }

  let isStringArray = true;
  value.forEach((item) => {
    if (!item || typeof item !== 'string') {
      isStringArray = false;
    }
  });

  return isStringArray;
};

export const isError = (errors: unknown): errors is ResetPasswordError => {
  if (!errors || typeof errors !== 'object') {
    return false;
  }

  const casted = errors as {
    old_password?: unknown;
    new_password1?: unknown;
    new_password2?: unknown;
  };

  if (
    (casted.old_password !== undefined &&
      !isStringArray(casted.old_password)) ||
    (casted.new_password1 !== undefined &&
      !isStringArray(casted.new_password1)) ||
    (casted.new_password2 !== undefined && !isStringArray(casted.new_password2))
  ) {
    return false;
  }

  return true;
};

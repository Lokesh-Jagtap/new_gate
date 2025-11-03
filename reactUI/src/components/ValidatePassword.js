export const validatePassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/.test(password);

export const passwordErrorMessage =
  "Password must be 8-15 chars, include uppercase, lowercase, number, and special character.";

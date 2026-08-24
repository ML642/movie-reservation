export const formatAccountDisplayName = (username) => {
  const value = String(username || '').trim();
  if (!value) return '';

  // OAuth accounts receive a deterministic suffix to keep usernames unique,
  // e.g. `Martsin_Lazouski_ub_190972427`. It is an implementation detail,
  // not a useful part of the name shown in the interface.
  const withoutOAuthSuffix = value.replace(/_[a-z]+_\d+$/i, '');
  return (withoutOAuthSuffix || value).replace(/_/g, ' ');
};

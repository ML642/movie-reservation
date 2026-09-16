export const formatAccountDisplayName = (username) => {
  const value = String(username || '').trim();
  if (!value) return '';

  const withoutOAuthSuffix = value.replace(/_[a-z]+_\d+$/i, '');
  return (withoutOAuthSuffix || value).replace(/_/g, ' ');
};

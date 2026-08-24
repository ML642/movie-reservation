import { formatAccountDisplayName } from './displayName';

describe('formatAccountDisplayName', () => {
  it('hides the generated OAuth uniqueness suffix', () => {
    expect(formatAccountDisplayName('Martsin_Lazouski_ub_190972427')).toBe('Martsin Lazouski');
  });

  it('formats ordinary underscore usernames for display', () => {
    expect(formatAccountDisplayName('movie_fan')).toBe('movie fan');
  });
});

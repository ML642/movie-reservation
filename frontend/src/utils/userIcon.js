export const USER_ICON_STORAGE_KEY = 'userIcon';
export const USER_ICON_CHANGE_EVENT = 'user-icon-change';

export const USER_ICON_OPTIONS = [
  { id: 'initial', label: 'Initial' },
  { id: 'film', label: 'Film' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'star', label: 'Star' },
  { id: 'video', label: 'Video' },
  { id: 'crown', label: 'Crown' },
];

export const getStoredUserIcon = () => {
  if (typeof window === 'undefined') return 'initial';
  return window.localStorage.getItem(USER_ICON_STORAGE_KEY) || 'initial';
};

export const setStoredUserIcon = (iconId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_ICON_STORAGE_KEY, iconId);
  window.dispatchEvent(new CustomEvent(USER_ICON_CHANGE_EVENT, { detail: iconId }));
};

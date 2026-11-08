// Hosting proxies can return plain text or HTML instead of the API's JSON.
// Never display their response body or JSON parser errors to the user.
export const readApiResponse = async (response) => {
  if (response.status === 429) {
    const error = new Error('Too many requests. Please wait a minute before trying again.');
    error.status = 429;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(response.ok
      ? 'The server returned an unexpected response. Please try again later.'
      : 'The server is temporarily unavailable. Please try again later.');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The server returned an unexpected response. Please try again later.');
  }
  return data;
};

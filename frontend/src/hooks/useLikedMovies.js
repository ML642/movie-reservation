import { useCallback, useEffect, useSyncExternalStore } from "react";
import { API_BASE_URL } from "../config/api";

const LIKED_MOVIES_STORAGE_KEY = "likedMovies";

const getLikeKey = (movieOrTitle) => {
  if (typeof movieOrTitle === "string") return movieOrTitle;

  const key = movieOrTitle?.title ?? movieOrTitle?.movieKey ?? movieOrTitle?.id;
  return key ? String(key) : "";
};

const getMovieTitle = (movieOrTitle) => {
  if (typeof movieOrTitle === "string") return movieOrTitle;
  return movieOrTitle?.title || "Movie";
};

const readStoredLikes = () => {
  if (typeof window === "undefined") return [];

  try {
    const storedLikes = window.localStorage.getItem(LIKED_MOVIES_STORAGE_KEY);
    const parsedLikes = storedLikes ? JSON.parse(storedLikes) : [];
    return Array.isArray(parsedLikes) ? parsedLikes.filter(Boolean).map(String) : [];
  } catch (error) {
    console.warn("Could not read liked movies from local storage.", error);
    return [];
  }
};

const uniqueLikes = (likes) => Array.from(new Set(likes.filter(Boolean).map(String)));

const saveStoredLikes = (likes) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIKED_MOVIES_STORAGE_KEY, JSON.stringify(uniqueLikes(likes)));
  } catch (error) {
    console.warn("Could not save liked movies to local storage.", error);
  }
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
};

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const getServerLikeKeys = (likedMovies = []) =>
  likedMovies.map(getLikeKey).filter(Boolean);

const toServerLikeRecord = (movieOrTitle) => {
  const movieKey = getLikeKey(movieOrTitle);

  if (typeof movieOrTitle === "string") {
    return { title: movieKey, movieKey };
  }

  return {
    ...movieOrTitle,
    title: movieOrTitle?.title || movieKey,
    movieKey: movieOrTitle?.movieKey || movieKey,
  };
};

const fetchServerLikes = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/likes`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Could not load liked movies (${response.status}).`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
};

const saveServerLike = async (movieOrTitle, token) => {
  if (!token || !API_BASE_URL) return null;

  const response = await fetch(`${API_BASE_URL}/api/likes`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ movie: toServerLikeRecord(movieOrTitle) }),
  });

  if (!response.ok) {
    throw new Error(`Could not save liked movie (${response.status}).`);
  }

  const payload = await response.json().catch(() => null);
  return payload?.data || null;
};

const removeServerLike = async (movieKey, token) => {
  if (!token || !API_BASE_URL) return;

  const response = await fetch(`${API_BASE_URL}/api/likes`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ movieKey }),
  });

  if (!response.ok) {
    throw new Error(`Could not remove liked movie (${response.status}).`);
  }
};

const sendBrowserNotification = async (movieTitle, isLiked) => {
  if (typeof window === "undefined" || !window.Notification) return;

  const NotificationApi = window.Notification;
  const body = isLiked
    ? `${movieTitle} was added to your liked movies.`
    : `${movieTitle} was removed from your liked movies.`;

  if (NotificationApi.permission === "granted") {
    new NotificationApi("CineReserve", { body });
    return;
  }

  if (NotificationApi.permission === "default") {
    const permission = await NotificationApi.requestPermission();
    if (permission === "granted") {
      new NotificationApi("CineReserve", { body });
    }
  }
};

const initialLikesState = {
  liked: readStoredLikes(),
  serverLikes: [],
  notice: null,
  isSyncing: false,
  hasLoadedServerLikes: false,
};

let likesState = initialLikesState;
let noticeTimerId = null;
let syncPromise = null;
let syncingToken = null;
let lastSyncedToken = null;
const listeners = new Set();
const pendingOperationsByKey = new Map();

const getLikesSnapshot = () => likesState;

const subscribeToLikes = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const updateLikesState = (nextState) => {
  likesState = { ...likesState, ...nextState };
  listeners.forEach((listener) => listener());
};

const setLikedMovies = (likes) => {
  const liked = uniqueLikes(likes);
  saveStoredLikes(liked);
  updateLikesState({ liked });
};

const upsertServerLike = (like) => {
  const likeKey = getLikeKey(like);
  if (!likeKey) return;

  updateLikesState({
    serverLikes: [
      ...likesState.serverLikes.filter((currentLike) => getLikeKey(currentLike) !== likeKey),
      { ...toServerLikeRecord(like), ...like },
    ],
  });
};

const removeCachedServerLike = (likeKey) => {
  updateLikesState({
    serverLikes: likesState.serverLikes.filter(
      (currentLike) => getLikeKey(currentLike) !== likeKey
    ),
  });
};

const showNotice = (movieTitle, isLiked) => {
  if (noticeTimerId) {
    window.clearTimeout(noticeTimerId);
  }

  updateLikesState({
    notice: {
      title: movieTitle,
      message: isLiked ? "Saved to liked movies" : "Removed from liked movies",
    },
  });

  noticeTimerId = window.setTimeout(() => {
    updateLikesState({ notice: null });
    noticeTimerId = null;
  }, 2600);
};

const enqueueServerOperation = (likeKey, operation) => {
  const previousOperation = pendingOperationsByKey.get(likeKey) || Promise.resolve();
  const nextOperation = previousOperation.catch(() => undefined).then(operation);

  pendingOperationsByKey.set(likeKey, nextOperation);
  nextOperation
    .finally(() => {
      if (pendingOperationsByKey.get(likeKey) === nextOperation) {
        pendingOperationsByKey.delete(likeKey);
      }
    })
    .catch(() => {});

  return nextOperation;
};

const syncLikedMovies = () => {
  const token = getToken();

  if (!token || !API_BASE_URL) {
    lastSyncedToken = null;
    updateLikesState({
      serverLikes: [],
      isSyncing: false,
      hasLoadedServerLikes: true,
    });
    return Promise.resolve();
  }

  if (syncPromise && syncingToken === token) {
    return syncPromise;
  }

  if (lastSyncedToken === token) {
    return Promise.resolve();
  }

  updateLikesState({
    serverLikes: [],
    isSyncing: true,
    hasLoadedServerLikes: false,
  });

  const currentSync = (async () => {
    try {
      const serverLikes = await fetchServerLikes(token);
      if (getToken() !== token) return;

      const localLikes = readStoredLikes();
      const serverLikeKeys = getServerLikeKeys(serverLikes);
      const mergedLikes = uniqueLikes([...localLikes, ...serverLikeKeys]);
      const localOnlyKeys = localLikes.filter((key) => !serverLikeKeys.includes(key));

      saveStoredLikes(mergedLikes);
      updateLikesState({ serverLikes, liked: mergedLikes });
      lastSyncedToken = token;

      const uploads = await Promise.allSettled(
        localOnlyKeys.map((key) => saveServerLike(key, token))
      );

      if (getToken() !== token) return;

      uploads.forEach((result, index) => {
        if (result.status === "fulfilled") {
          upsertServerLike(result.value || toServerLikeRecord(localOnlyKeys[index]));
        } else {
          console.warn("Could not sync liked movie with server.", result.reason);
        }
      });
    } catch (error) {
      if (getToken() === token) {
        console.warn("Could not sync liked movies with server.", error);
      }
    } finally {
      if (getToken() === token) {
        updateLikesState({ isSyncing: false, hasLoadedServerLikes: true });
      }
    }
  })();

  syncPromise = currentSync;
  syncingToken = token;
  currentSync
    .finally(() => {
      if (syncPromise === currentSync) {
        syncPromise = null;
        syncingToken = null;
      }
    })
    .catch(() => {});

  return currentSync;
};

const toggleMovieLike = (movieOrTitle) => {
  const likeKey = getLikeKey(movieOrTitle);
  if (!likeKey) return;

  const wasLiked = likesState.liked.includes(likeKey);
  const nextLikes = wasLiked
    ? likesState.liked.filter((key) => key !== likeKey)
    : [...likesState.liked, likeKey];
  const movieTitle = getMovieTitle(movieOrTitle);

  setLikedMovies(nextLikes);
  showNotice(movieTitle, !wasLiked);
  void sendBrowserNotification(movieTitle, !wasLiked);

  const token = getToken();
  if (!token || !API_BASE_URL) return;

  if (wasLiked) {
    removeCachedServerLike(likeKey);
  } else {
    upsertServerLike(toServerLikeRecord(movieOrTitle));
  }

  const syncAction = wasLiked
    ? () => removeServerLike(likeKey, token)
    : () => saveServerLike(movieOrTitle, token);

  enqueueServerOperation(likeKey, syncAction)
    .then((savedLike) => {
      if (!wasLiked && savedLike) {
        upsertServerLike(savedLike);
      }
    })
    .catch((error) => {
      console.warn("Could not sync liked movie with server.", error);
    });
};

export const useLikedMovies = () => {
  const { liked, serverLikes, notice, isSyncing, hasLoadedServerLikes } = useSyncExternalStore(
    subscribeToLikes,
    getLikesSnapshot,
    getLikesSnapshot
  );

  useEffect(() => {
    void syncLikedMovies();
  }, []);

  useEffect(() => {
    const syncFromAnotherTab = (event) => {
      if (event.key === LIKED_MOVIES_STORAGE_KEY) {
        updateLikesState({ liked: readStoredLikes() });
      }
    };

    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const isLiked = useCallback(
    (movieOrTitle) => liked.includes(getLikeKey(movieOrTitle)),
    [liked]
  );

  const toggleLike = useCallback((movieOrTitle) => {
    toggleMovieLike(movieOrTitle);
  }, []);

  return {
    liked,
    serverLikes,
    notice,
    isSyncing,
    hasLoadedServerLikes,
    isLiked,
    toggleLike,
  };
};

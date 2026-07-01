import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config/api";

const LIKED_MOVIES_STORAGE_KEY = "likedMovies";

const getLikeKey = (movieOrTitle) => {
  if (typeof movieOrTitle === "string") return movieOrTitle;
  const key = movieOrTitle?.title ?? movieOrTitle?.id;
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

const saveStoredLikes = (likes) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LIKED_MOVIES_STORAGE_KEY, JSON.stringify(likes));
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
  likedMovies
    .map((movie) => movie?.movieKey || movie?.title || movie?.id)
    .filter(Boolean)
    .map(String);

const saveServerLike = async (movieOrTitle) => {
  const token = getToken();
  if (!token || !API_BASE_URL) return;

  const body =
    typeof movieOrTitle === "string"
      ? { movie: { title: movieOrTitle, movieKey: movieOrTitle } }
      : { movie: { ...movieOrTitle, movieKey: getLikeKey(movieOrTitle) } };

  await fetch(`${API_BASE_URL}/api/likes`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
};

const removeServerLike = async (movieKey) => {
  const token = getToken();
  if (!token || !API_BASE_URL) return;

  await fetch(`${API_BASE_URL}/api/likes`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ movieKey }),
  });
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

export const useLikedMovies = () => {
  const [liked, setLiked] = useState(readStoredLikes);
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    saveStoredLikes(liked);
  }, [liked]);

  useEffect(() => {
    const token = getToken();
    if (!token || !API_BASE_URL) return undefined;

    let isMounted = true;

    const syncLikes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/likes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const payload = await response.json();
        const serverKeys = getServerLikeKeys(payload.data);
        const localKeys = readStoredLikes();
        const mergedKeys = Array.from(new Set([...localKeys, ...serverKeys]));

        if (isMounted) {
          setLiked(mergedKeys);
        }

        const localOnlyKeys = localKeys.filter((key) => !serverKeys.includes(key));
        await Promise.all(localOnlyKeys.map((key) => saveServerLike(key)));
      } catch (error) {
        console.warn("Could not sync liked movies with server.", error);
      }
    };

    syncLikes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const showNotice = useCallback((movieTitle, isLiked) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }

    setNotice({
      title: movieTitle,
      message: isLiked ? "Saved to liked movies" : "Removed from liked movies",
    });

    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
    }, 2600);
  }, []);

  const isLiked = useCallback(
    (movieOrTitle) => liked.includes(getLikeKey(movieOrTitle)),
    [liked]
  );

  const toggleLike = useCallback(
    (movieOrTitle) => {
      const likeKey = getLikeKey(movieOrTitle);
      if (!likeKey) return;

      const movieTitle = getMovieTitle(movieOrTitle);
      const nextIsLiked = !liked.includes(likeKey);

      setLiked((currentLikes) => {
        if (currentLikes.includes(likeKey)) {
          return currentLikes.filter((key) => key !== likeKey);
        }

        return [...currentLikes, likeKey];
      });

      showNotice(movieTitle, nextIsLiked);
      sendBrowserNotification(movieTitle, nextIsLiked);

      const syncAction = nextIsLiked ? saveServerLike(movieOrTitle) : removeServerLike(likeKey);
      syncAction.catch((error) => {
        console.warn("Could not sync liked movie with server.", error);
      });
    },
    [liked, showNotice]
  );

  return {
    liked,
    isLiked,
    notice,
    toggleLike,
  };
};

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CustomSelect from "../../components/custom-select/CustomSelect";
import { useLikedMovies } from "../../hooks/useLikedMovies";
import "./MovieListMobile.css";

const MOBILE_GENRE_OPTIONS = [
  "all",
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Drama",
  "Family",
  "Fantasy",
  "Horror",
  "Science Fiction",
  "Thriller",
];

const mobileGenreOptions = MOBILE_GENRE_OPTIONS.map((option) => ({
  value: option,
  label: option === "all" ? "All Genres" : option,
}));

const mobileSortOptions = [
  { value: "date-desc", label: "Newest" },
  { value: "date-asc", label: "Oldest" },
  { value: "rating-desc", label: "Rating High" },
  { value: "rating-asc", label: "Rating Low" },
  { value: "title-az", label: "Title A-Z" },
  { value: "title-za", label: "Title Z-A" },
];

const normalizeDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const formatDate = (value) => {
  const parsed = normalizeDate(value);
  if (!parsed) return "Unknown date";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatRating = (value) => {
  const number = Number(value);
  if (Number.isFinite(number)) {
    return number.toFixed(1);
  }
  return "N/A";
};

const MovieListMobile = ({ movies, loading, hasMore, loadingMore, onLoadMore }) => {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState("date-desc");
  const { isLiked, notice, toggleLike } = useLikedMovies();

  const visibleMovies = useMemo(() => {
    const filtered = movies
      .filter((movie) => movie?.title?.toLowerCase().includes(search.toLowerCase()))
      .filter((movie) => (genre === "all" ? true : movie?.genre === genre));

    return filtered.sort((a, b) => {
      if (sort === "rating-desc") return (Number(b?.rating) || 0) - (Number(a?.rating) || 0);
      if (sort === "rating-asc") return (Number(a?.rating) || 0) - (Number(b?.rating) || 0);
      if (sort === "title-az") return (a?.title || "").localeCompare(b?.title || "");
      if (sort === "title-za") return (b?.title || "").localeCompare(a?.title || "");

      const dateA = normalizeDate(a?.date)?.getTime() || 0;
      const dateB = normalizeDate(b?.date)?.getTime() || 0;
      return sort === "date-asc" ? dateA - dateB : dateB - dateA;
    });
  }, [movies, search, genre, sort]);

  return (
    <section className="mlm-shell">
      <header className="mlm-header">
        <h1 className="mlm-title">All Movies</h1>
        <p className="mlm-subtitle">{visibleMovies.length} available on this view</p>
      </header>

      {notice && (
        <div className="like-notice" role="status" aria-live="polite">
          <strong>{notice.message}</strong>
          <span>{notice.title}</span>
        </div>
      )}

      <div className="mlm-filters">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mlm-input"
        />

        <div className="mlm-row">
          <CustomSelect
            className="mlm-select-wrap"
            ariaLabel="Genre"
            value={genre}
            onChange={setGenre}
            options={mobileGenreOptions}
          />

          <CustomSelect
            className="mlm-select-wrap"
            ariaLabel="Sort movies"
            value={sort}
            onChange={setSort}
            options={mobileSortOptions}
          />
        </div>
      </div>

      <div className="mlm-grid">
        {loading && movies.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="mlm-card mlm-skeleton">
              <div className="mlm-skeleton-media"></div>
              <div className="mlm-skeleton-line"></div>
              <div className="mlm-skeleton-line short"></div>
            </div>
          ))
        ) : visibleMovies.length === 0 ? (
          <div className="mlm-empty">No movies found for these filters.</div>
        ) : (
          visibleMovies.map((movie) => (
            <article key={movie?.id || movie?.title} className="mlm-card">
              <button
                type="button"
                className={`mlm-like-btn${isLiked(movie) ? " liked" : ""}`}
                onClick={() => toggleLike(movie)}
                title={isLiked(movie) ? "Unlike" : "Like"}
                aria-label={isLiked(movie) ? `Unlike ${movie?.title}` : `Like ${movie?.title}`}
              >
                {isLiked(movie) ? "â¤ï¸" : "ðŸ¤"}
              </button>
              <img
                className="mlm-poster"
                src={movie?.poster || "https://via.placeholder.com/500x750?text=No+Poster"}
                alt={movie?.title || "Movie poster"}
                loading="lazy"
              />
              <div className="mlm-body">
                <h2 className="mlm-movie-title">{movie?.title || "Untitled"}</h2>
                <p className="mlm-meta">
                  {movie?.genre || "Unknown"} | {formatRating(movie?.rating)}
                </p>
                <p className="mlm-date">{formatDate(movie?.date)}</p>
                <Link to={`/movie/${movie?.id}`} className="mlm-book-btn">
                  Book Now
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

      {hasMore && (
        <div className="mlm-load-wrap">
          <button
            type="button"
            className="mlm-load-btn"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "See More"}
          </button>
        </div>
      )}
    </section>
  );
};

export default MovieListMobile;

export interface LikedMovieRecord {
  userId: string;
  movieKey: string;
  movieId?: string;
  title: string;
  poster?: string;
  rating?: unknown;
  date?: string;
  genre?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

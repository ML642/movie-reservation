export interface CommentRecord {
  _id?: { toString(): string } | string;
  id?: string;
  movieId: string;
  userId: string;
  username: string;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

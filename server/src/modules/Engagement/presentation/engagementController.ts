import type { RequestHandler } from 'express';
import { EngagementError } from '../domain/EngagementError';
import type { EngagementService } from '../application/EngagementService';

type AuthenticatedRequest = Parameters<RequestHandler>[0] & {
  user?: { userId: string; username: string };
};

const getUserId = (request: AuthenticatedRequest): string | undefined => request.user?.userId;
const getUsername = (request: AuthenticatedRequest): string => request.user?.username || 'User';
const getRouteParameter = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] || '' : value || '');

const handleError = (error: unknown, response: Parameters<RequestHandler>[1], fallbackMessage: string): void => {
  if (error instanceof EngagementError) {
    const statusByCode = {
      STORAGE_UNAVAILABLE: 503,
      INVALID_MOVIE: 400,
      INVALID_COMMENT: 400,
      FORBIDDEN: 403,
    } as const;
    response.status(statusByCode[error.code]).json({ success: false, message: error.message });
    return;
  }

  console.error('Engagement operation error:', error);
  response.status(500).json({ success: false, message: fallbackMessage });
};

export interface EngagementController {
  listLikes: RequestHandler;
  addLike: RequestHandler;
  removeLike: RequestHandler;
  listComments: RequestHandler;
  addComment: RequestHandler;
  updateComment: RequestHandler;
  removeComment: RequestHandler;
}

export const createEngagementController = (service: EngagementService): EngagementController => ({
  listLikes: async (request, response, next) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    try {
      const likes = await service.listLikes(userId);
      response.json({ success: true, data: likes });
    } catch (error) {
      next(error);
    }
  },

  addLike: async (request, response) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    try {
      const like = await service.addLike(userId, (request.body.movie || request.body) as object);
      response.status(201).json({ success: true, data: like });
    } catch (error) {
      handleError(error, response, 'Unable to save liked movie');
    }
  },

  removeLike: async (request, response) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const movieKey = request.body.movieKey || getRouteParameter(request.params.movieKey);
    try {
      await service.removeLike(userId, movieKey);
      response.json({ success: true, movieKey });
    } catch (error) {
      handleError(error, response, 'Unable to remove liked movie');
    }
  },

  listComments: async (request, response) => {
    try {
      const comments = await service.listComments(getRouteParameter(request.params.movieId));
      response.json({ success: true, data: comments });
    } catch (error) {
      handleError(error, response, 'Unable to load comments');
    }
  },

  addComment: async (request, response) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    try {
      const comment = await service.createComment({
        movieId: getRouteParameter(request.params.movieId),
        userId,
        username: getUsername(request as AuthenticatedRequest),
        text: request.body.text,
      });
      response.status(201).json({ success: true, data: comment });
    } catch (error) {
      handleError(error, response, 'Unable to save comment');
    }
  },

  updateComment: async (request, response) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    try {
      const comment = await service.updateComment(getRouteParameter(request.params.commentId), userId, request.body.text);
      if (!comment) {
        response.status(404).json({ success: false, message: 'Comment not found' });
        return;
      }
      response.json({ success: true, data: comment });
    } catch (error) {
      handleError(error, response, 'Unable to update comment');
    }
  },

  removeComment: async (request, response) => {
    const userId = getUserId(request as AuthenticatedRequest);
    if (!userId) {
      response.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    try {
      const comment = await service.removeComment(getRouteParameter(request.params.commentId), userId);
      if (!comment) {
        response.status(404).json({ success: false, message: 'Comment not found' });
        return;
      }
      response.json({ success: true, commentId: request.params.commentId });
    } catch (error) {
      handleError(error, response, 'Unable to delete comment');
    }
  },
});

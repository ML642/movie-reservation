import { IdentityError } from '../../domain/IdentityError';
import type { TokenPayload, TokenProvider } from '../../application/ports/TokenProvider';

const jwt = require('jsonwebtoken');

export class JwtTokenProvider implements TokenProvider {
  issue(payload: TokenPayload): string {
    return jwt.sign({ ...payload, tokenType: 'access' }, this.getSecret(), { expiresIn: '15m' });
  }

  verify(token: string): TokenPayload {
    const payload = jwt.verify(token, this.getSecret()) as TokenPayload & { tokenType?: string };
    if (payload.tokenType !== 'access') throw new IdentityError('INVALID_CREDENTIALS', 'Invalid token');
    return payload;
  }

  issueRefresh(payload: TokenPayload): string {
    return jwt.sign({ ...payload, tokenType: 'refresh' }, this.getSecret(), { expiresIn: '30d' });
  }

  verifyRefresh(token: string): TokenPayload {
    const payload = jwt.verify(token, this.getSecret()) as TokenPayload & { tokenType?: string };
    if (payload.tokenType !== 'refresh') throw new IdentityError('INVALID_CREDENTIALS', 'Invalid token');
    return payload;
  }

  private getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new IdentityError('CONFIGURATION_ERROR', 'JWT_SECRET must be configured');
    }

    return secret;
  }
}

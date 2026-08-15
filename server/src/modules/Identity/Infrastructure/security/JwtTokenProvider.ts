import { IdentityError } from '../../domain/IdentityError';
import type { TokenPayload, TokenProvider } from '../../application/ports/TokenProvider';

const jwt = require('jsonwebtoken');

export class JwtTokenProvider implements TokenProvider {
  issue(payload: TokenPayload): string {
    return jwt.sign(payload, this.getSecret(), { expiresIn: '7d' });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.getSecret()) as TokenPayload;
  }

  private getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new IdentityError('CONFIGURATION_ERROR', 'JWT_SECRET must be configured');
    }

    return secret;
  }
}

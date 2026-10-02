import { createClerkClient } from '@clerk/backend';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../config/env.js';
import {
  ACCESS_TOKEN_VERIFIER,
  TEAM_MEMBERSHIP_CHECKER,
} from '../../application/constants/injection-tokens.js';
import { ClerkAccessTokenVerifier } from './clerk/clerk-access-token-verifier.js';
import { ClerkTeamMembershipChecker } from './clerk/clerk-team-membership-checker.js';

/** Binds the identity ports to their Clerk adapters. */
export const identityAccessProviders: Provider[] = [
  {
    provide: ACCESS_TOKEN_VERIFIER,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new ClerkAccessTokenVerifier({
        secretKey: config.get('CLERK_SECRET_KEY'),
        jwtKey: config.get('CLERK_JWT_KEY'),
        authorizedParties: config.get('CLERK_AUTHORIZED_PARTIES'),
      }),
  },
  {
    provide: TEAM_MEMBERSHIP_CHECKER,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new ClerkTeamMembershipChecker(
        createClerkClient({ secretKey: config.get('CLERK_SECRET_KEY') }),
      ),
  },
];

import { HexclaveServerApp } from '@hexclave/js';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../../config/env.js';
import {
  ACCESS_TOKEN_VERIFIER,
  TEAM_MEMBERSHIP_CHECKER,
} from '../../application/constants/injection-tokens.js';
import { HexclaveAccessTokenVerifier } from './hexclave/hexclave-access-token-verifier.js';
import { HexclaveTeamMembershipChecker } from './hexclave/hexclave-team-membership-checker.js';

const HEXCLAVE_SERVER_APP = Symbol('HexclaveServerApp');

/** Binds the identity ports to their Hexclave adapters. */
export const identityAccessProviders: Provider[] = [
  {
    provide: HEXCLAVE_SERVER_APP,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new HexclaveServerApp({
        tokenStore: null,
        baseUrl: config.get('HEXCLAVE_API_URL'),
        projectId: config.get('HEXCLAVE_PROJECT_ID'),
        publishableClientKey: config.get('HEXCLAVE_PUBLISHABLE_CLIENT_KEY'),
        secretServerKey: config.get('HEXCLAVE_SECRET_SERVER_KEY'),
      }),
  },
  {
    provide: ACCESS_TOKEN_VERIFIER,
    inject: [ConfigService],
    useFactory: (config: ConfigService<Env, true>) =>
      new HexclaveAccessTokenVerifier(
        config.get('HEXCLAVE_API_URL'),
        config.get('HEXCLAVE_PROJECT_ID'),
      ),
  },
  {
    provide: TEAM_MEMBERSHIP_CHECKER,
    inject: [HEXCLAVE_SERVER_APP],
    useFactory: (hexclave: HexclaveServerApp) =>
      new HexclaveTeamMembershipChecker(hexclave),
  },
];

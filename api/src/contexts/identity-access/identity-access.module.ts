import { Module } from '@nestjs/common';
import {
  ACCESS_TOKEN_VERIFIER,
  TEAM_MEMBERSHIP_CHECKER,
} from './application/constants/injection-tokens.js';
import { AccessTokenGuard } from './entrypoints/http/guards/access-token.guard.js';
import { TeamAdminGuard } from './entrypoints/http/guards/team-admin.guard.js';
import { TeamMemberGuard } from './entrypoints/http/guards/team-member.guard.js';
import { identityAccessProviders } from './infrastructure/providers/identity-access.providers.js';

/**
 * Bounded context "Identity & Access": who the caller is and which teams
 * (tenants) they belong to. Identity is delegated to Clerk; this module
 * only exposes ports and guards to the other contexts.
 */
@Module({
  providers: [
    ...identityAccessProviders,
    AccessTokenGuard,
    TeamMemberGuard,
    TeamAdminGuard,
  ],
  exports: [
    ACCESS_TOKEN_VERIFIER,
    TEAM_MEMBERSHIP_CHECKER,
    AccessTokenGuard,
    TeamMemberGuard,
    TeamAdminGuard,
  ],
})
export class IdentityAccessModule {}

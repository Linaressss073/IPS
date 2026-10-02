Authentication, users and organizations are handled by Clerk (`@clerk/nextjs`): each IPS (tenant) is a Clerk
organization, and the active organization follows the `/dashboard/:id` URL (see `middleware.ts`). Business data is
served by the API in `../api`, called with the Clerk session token (`lib/api/use-api-auth.ts`). For Clerk guidance see
https://clerk.com/SKILL.md.

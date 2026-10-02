import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isDashboard = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isDashboard(request)) await auth.protect();
  },
  {
    // /dashboard/<orgId>/… makes that organization (IPS) the active one, so
    // the session token sent to the API carries the IPS being viewed.
    organizationSyncOptions: {
      organizationPatterns: ["/dashboard/:id", "/dashboard/:id/(.*)"],
    },
  },
);

export const config = {
  matcher: [
    // Every route except Next.js internals and static files…
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // …and always API routes.
    "/(api|trpc)(.*)",
  ],
};

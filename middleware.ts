import { withAuth } from "next-auth/middleware";

/**
 * Route protection. Replaces the Meteor client-side `requireAuth` redirects.
 * Unauthenticated users hitting a protected route are sent to /mainUI.
 */
export default withAuth({
  pages: {
    signIn: "/mainUI",
  },
});

export const config = {
  matcher: [
    "/",
    "/map",
    "/ai-suggestion",
    "/profile",
    "/search-history",
    "/meal-planner",
    "/saved-restaurants",
    "/travel-plans/:path*",
    "/discover",
    "/travel-planning",
  ],
};

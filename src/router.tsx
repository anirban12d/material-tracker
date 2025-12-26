import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
// Note: Default components are set inline to avoid circular dependencies
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingMs: 300,
  defaultPendingMinMs: 200,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

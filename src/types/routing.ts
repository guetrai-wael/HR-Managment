import { ReactNode } from "react";

// ==========================================
// Routing Types
// ==========================================

/** Defines the structure for a route configuration object. */
export interface IRouteItem {
  /** The URL path for the route. */
  path: string;
  /** The React component to render for this route. */
  element: ReactNode;
  /** An optional layout component to wrap the route's element. */
  layout?: React.ComponentType<{ children: ReactNode }>;
  /** An optional guard component to protect the route (e.g., for authentication). */
  guard?: ({ children }: { children: ReactNode }) => ReactNode;
}

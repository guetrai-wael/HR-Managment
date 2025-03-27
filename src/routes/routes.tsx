import { Routes, Route, Navigate } from "react-router-dom";
import { Login, Signup } from "../pages/Auth";
import { IRouteItem } from "../types";

import { Fragment } from "react";
import { AuthGuard, GuestGuard } from "../guards";
import { Jobs } from "../pages/Jobs";

export const routes: IRouteItem[] = [
  {
    path: "/login",
    element: <Login />,
    guard: GuestGuard,
  },
  {
    path: "/signup",
    element: <Signup />,
    guard: GuestGuard,
  },
  {
    path: "/",
    element: <Jobs />,
    guard: AuthGuard,
  },
  {
    path: "*",
    element: <Navigate to="/login" />,
  },
];

export const renderRoutes = (routes: IRouteItem[]) => {
  return (
    <Routes>
      {routes.map((route, i) => {
        const Layout = route.layout || Fragment;
        const Guard = route.guard || Fragment;
        return (
          <Route
            key={i}
            path={route.path}
            element={
              <Guard>
                <Layout>{route.element}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  );
};

export default routes;

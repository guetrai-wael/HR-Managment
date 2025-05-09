import { Fragment, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { IRouteItem } from "../types";
import {
  AuthGuard,
  GuestGuard,
  AdminGuard,
  EmployeeGuard,
  PublicGuard,
} from "../guards";
import MainLayout from "../components/Layouts/MainLayout";
import { Spin } from "antd";

// Lazy load pages
const Login = lazy(() => import("../pages/Auth/Login"));
const Signup = lazy(() => import("../pages/Auth/Signup"));
const Jobs = lazy(() => import("../pages/Jobs/Jobs"));
const JobDetails = lazy(() => import("../pages/Jobs/JobDetails"));
const Applications = lazy(() => import("../pages/Applications/Applications"));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spin size="large" />
  </div>
);

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
    guard: PublicGuard,
    layout: MainLayout,
  },
  {
    path: "/jobs/:id",
    element: <JobDetails />,
    guard: PublicGuard,
    layout: MainLayout,
  },
  {
    path: "/applications",
    element: <Applications />,
    guard: AuthGuard,
    layout: MainLayout,
  },
  {
    path: "*",
    element: <Navigate to="/" />,
  },
];

export const renderRoutes = (routes: IRouteItem[]) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
    </Suspense>
  );
};

export default routes;

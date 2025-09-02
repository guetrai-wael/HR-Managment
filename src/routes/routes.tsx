import { Fragment, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { IRouteItem } from "../types";
import { AuthGuard, GuestGuard, PublicGuard, AdminGuard } from "../guards";
import MainLayout from "../components/Layouts/MainLayout";
import LoadingFallback from "../components/common/LoadingFallback";

// Lazy load pages
const Login = lazy(() => import("../pages/Auth/Login"));
const Signup = lazy(() => import("../pages/Auth/Signup"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Jobs = lazy(() => import("../pages/Jobs/Jobs"));
const JobDetails = lazy(() => import("../pages/Jobs/JobDetails"));
const Applications = lazy(() => import("../pages/Applications/Applications"));
const Employees = lazy(() => import("../pages/Employees/Employees"));
const SettingsPage = lazy(() => import("../pages/Profile/SettingsPage"));
const UserProfilePage = lazy(() => import("../pages/Profile/UserProfilePage"));
const LeavePage = lazy(() => import("../pages/Leave/LeavePage"));

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
    element: <Dashboard />,
    guard: AuthGuard,
    layout: MainLayout,
  },
  {
    path: "/jobs",
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
    path: "/employees",
    element: <Employees />,
    guard: AdminGuard,
    layout: MainLayout,
  },
  {
    path: "/employees/:userId",
    element: <UserProfilePage />,
    guard: AdminGuard, // Or AuthGuard if non-admins can view some profiles
    layout: MainLayout,
  },
  {
    path: "/profile",
    element: <UserProfilePage />,
    guard: AuthGuard, // All authenticated users can view their own profile
    layout: MainLayout,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    guard: AuthGuard,
    layout: MainLayout,
  },
  {
    path: "/leaves",
    element: <LeavePage />,
    guard: AuthGuard, // All authenticated users (employees, admins) can access /leaves
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

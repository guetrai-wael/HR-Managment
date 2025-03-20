// src/routes/routes.tsx
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Auth/Login/Login";
import Signup from "../pages/Auth/Signup/Signup";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="*"
        element={
          <div className="text-center p-8 text-gray-600">Page not found</div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

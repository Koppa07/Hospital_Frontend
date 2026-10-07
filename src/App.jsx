import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import History from "./pages/History";
import Schedule from "./pages/Schedule";
import Patients from "./pages/Reports/Patients";
import Doctors from "./pages/Reports/Doctors";
import Dep from "./pages/Reports/Dep";
import Room from "./pages/Reports/Room";
import Spec from "./pages/Reports/Spec";
import Disease from "./pages/Reports/Disease";
import Drug from "./pages/Reports/Drug";
import Reports from "./pages/Reports";
import Appointments from "./pages/Appointments";
import Layout from "./components/Layout";
function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function SignupAndLogout() {
  localStorage.clear();
  return <Signup />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<SignupAndLogout />} />

        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <ProtectedRoute
            requireProfile
            path="/medical-history"
            element={<History />}
          />
          <ProtectedRoute
            requireProfile
            path="/schedule"
            element={<Schedule />}
          />
          <ProtectedRoute
            requireProfile
            path="/patients"
            element={<Patients />}
          />
          <ProtectedRoute
            requireProfile
            path="/doctors"
            element={<Doctors />}
          />
          <ProtectedRoute
            requireProfile
            path="/departments"
            element={<Dep />}
          />
          <ProtectedRoute requireProfile path="/rooms" element={<Room />} />
          <ProtectedRoute
            requireProfile
            path="/specializations"
            element={<Spec />}
          />
          <ProtectedRoute requireProfile path="/drugs" element={<Drug />} />
          <ProtectedRoute
            requireProfile
            path="/diseases"
            element={<Disease />}
          />
          <ProtectedRoute
            requireProfile
            path="/appointments"
            element={<Appointments />}
          />
          <ProtectedRoute
            requireProfile
            path="/reports"
            element={<Reports />}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

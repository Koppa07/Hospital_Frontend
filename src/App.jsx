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
          <Route
            path="/medical-history"
            element={
              <ProtectedRoute requireProfile>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute requireProfile>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute requireProfile>
                <Patients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute requireProfile>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute requireProfile>
                <Dep />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rooms"
            element={
              <ProtectedRoute requireProfile>
                <Room />
              </ProtectedRoute>
            }
          />
          <Route
            path="/specializations"
            element={
              <ProtectedRoute requireProfile>
                <Spec />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drug"
            element={
              <ProtectedRoute requireProfile>
                <Drug />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diseases"
            element={
              <ProtectedRoute requireProfile>
                <Disease />
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute requireProfile>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requireProfile>
                <Reports />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

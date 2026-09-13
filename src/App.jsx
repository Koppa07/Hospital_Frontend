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
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/signup" element={<SignupAndLogout />} />
        <Route path="/medical-history" element={<History />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/departments" element={<Dep />} />
        <Route path="/rooms" element={<Room />} />
        <Route path="/specializations" element={<Spec />} />
        <Route path="/drugs" element={<Drug />} />
        <Route path="/diseases" element={<Disease />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN, USER_INFO } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children, requireProfile = false }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isProfileChecked, setIsProfileChecked] = useState(!requireProfile);
  const [hasProfile, setHasProfile] = useState(true);
  useEffect(() => {
    auth().catch(() => setIsAuthorized(false));
  }, []);
  useEffect(() => {
    if (isAuthorized === true && requireProfile) {
      checkProfile();
    }
  });

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN);
    try {
      const res = await api.post("api/token/refresh/", {
        refresh: refreshToken,
      });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.log(error);
      setIsAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    const decoded = jwtDecode(token);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
      await refreshToken();
    } else {
      setIsAuthorized(true);
    }
  };

  const checkProfile = async () => {
    const savedUser = localStorage.getItem(USER_INFO);
    const user = savedUser ? JSON.parse : null;

    if (user?.role !== "PATIENT" && user?.role !== "DOCTOR") {
      setHasProfile(true);
      setIsProfileChecked(true);
      return;
    }

    try {
      await api.get("/patient/profile");
      setHasProfile(true);
    } catch (err) {
      if (err.response?.status === 404) {
        setHasProfile(false);
      } else {
        console.error("Ошибка проверки профиля:", err);
        setHasProfile(true);
      }
    } finally {
      setIsProfileChecked(true);
    }
  };

  if (isAuthorized === null) {
    return <div>Загрузка...</div>;
  }
  if (requireProfile && !isProfileChecked) {
    return <div>Проверка профиля...</div>;
  }
  if (requireProfile && !hasProfile) {
    return <Navigate to="/" replace />;
  }
  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;

import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_INFO } from "../constants";
import "../styles/Form.css";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PATIENT");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload =
      method === "login"
        ? { username, password }
        : { username, password, role };

    try {
      const res = await api.post(route, payload);
      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        if (res.data.user) {
          localStorage.setItem(USER_INFO, JSON.stringify(res.data.user));
        }
        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData
        ? Object.entries(errorData)
            .map(
              ([field, msgs]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
            )
            .join("\n")
        : "Ошибка авторизации/регистрации";

      alert(errorMessage);
    }
  };

  const name = method === "login" ? "Вход" : "Регистрация";
  const btn_name = method === "login" ? "Войти" : "Зарегистрироваться";

  return (
    <form onSubmit={handleSubmit} className="form__container">
      <div className="form-group">
        <h1>{name}</h1>
        <input
          className="my__input"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Имя пользователя"
          required
        />
      </div>
      <div className="form-group">
        <input
          className="my__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          required
        />
      </div>

      {method === "signup" && (
        <select
          className="my__input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="PATIENT">Пациент</option>
          <option value="DOCTOR">Врач</option>
          <option value="REGISTRAR">Регистратор</option>
          <option value="ADMIN">Администратор</option>
        </select>
      )}
      <button className="btn--prime" type="submit">
        {btn_name}
      </button>
    </form>
  );
}

export default Form;

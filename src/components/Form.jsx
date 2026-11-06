import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_INFO } from "../constants";
import "../styles/Form.css";

const roles = [
  { value: "PATIENT", label: "Пациент" },
  { value: "DOCTOR", label: "Врач" },
  { value: "REGISTRAR", label: "Регистратор" },
  { value: "ADMIN", label: "Администратор" },
];

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(method === "signup" ? "PATIENT" : "");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (method !== "login" || !role) {
      return undefined;
    }

    let isCurrentRequest = true;
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const response = await api.get("user/by-role/", { params: { role } });
        if (isCurrentRequest) {
          setUsers(response.data);
        }
      } catch {
        if (isCurrentRequest) {
          setUsers([]);
          setUsersError("Не удалось загрузить список пользователей.");
        }
      } finally {
        if (isCurrentRequest) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();
    return () => {
      isCurrentRequest = false;
    };
  }, [method, role]);

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
      <h1>{name}</h1>
      {method === "login" && (
        <label className="form-group">
          <select
            className="my__input"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setUsername("");
              setPassword("");
              setUsers([]);
            }}
            required
          >
            <option value="">Выберите роль</option>
            {roles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form-group">
        {method === "login" ? (
          <>
            <select
              className="my__input"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setPassword("");
              }}
              disabled={!role || usersLoading || users.length === 0}
              required
            >
              <option value="">
                {usersLoading ? "Загрузка..." : "Выберите логин"}
              </option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
            {usersError && <p className="form__message">{usersError}</p>}
            {!usersLoading && role && !usersError && users.length === 0 && (
              <p className="form__message">
                Для выбранной роли нет активных пользователей.
              </p>
            )}
          </>
        ) : (
          <input
            className="my__input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Имя пользователя"
            required
          />
        )}
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
          {roles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      )}
      <button className="btn--prime" type="submit">
        {btn_name}
      </button>
    </form>
  );
}

export default Form;

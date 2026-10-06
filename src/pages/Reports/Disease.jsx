import api from "../../api";
import { useState, useEffect } from "react";
import "../../styles/Reports/reports.css";
import NotFound from "../NotFound";
import { USER_INFO } from "../../constants";

function Disease() {
  const savedUser = localStorage.getItem(USER_INFO);
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  const isRegistrar = currentUser?.role === "REGISTRAR";

  if (isRegistrar) <NotFound />;

  const [diseases, setDiseases] = useState([]);
  const [error, setError] = useState(null);

  const fetchDiseases = async () => {
    setError(null);
    try {
      const res = await api.get("/diseases/");
      setDiseases(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Не удалось загрузить сведения о болезнях",
      );
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  return (
    <div className="report__container">
      <div className="report__header">
        <h2>Список болезней</h2>
      </div>

      {error && <div className="reports__error">{error}</div>}

      <div className="reports__grid">
        {diseases.length > 0 ? (
          diseases.map((disease) => (
            <div
              key={disease.disease_id || disease.id}
              className="report__card"
            >
              <div className="report__card-body">
                <h3>{disease.disease_title || disease.title}</h3>
                {disease.disease_code && (
                  <p>
                    <strong>Код болезни:</strong> {disease.disease_code}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="reports__empty">
            Болезни по вашему запросу не найдены.
          </p>
        )}
      </div>
    </div>
  );
}

export default Disease;

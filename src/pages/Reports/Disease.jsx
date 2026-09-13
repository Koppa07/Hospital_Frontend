import api from "../../api";
import { useState, useEffect } from "react";
import "C:/Users/Koppa07/vsCodeProjects/frontend/src/styles/Reports/disease.css";

function Disease() {
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
    <div className="disease__container">
      <div className="disease__header">
        <h2>Список болезней</h2>
      </div>

      {error && <div className="diseases__error">{error}</div>}

      <div className="diseases__grid">
        {diseases.length > 0 ? (
          diseases.map((disease) => (
            <div
              key={disease.disease_id || disease.id}
              className="disease__card"
            >
              <div className="disease__card-body">
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
          <p className="diseases__empty">
            Болезни по вашему запросу не найдены.
          </p>
        )}
      </div>
    </div>
  );
}

export default Disease;

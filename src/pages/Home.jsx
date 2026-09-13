import { USER_INFO } from "../constants";
import "../styles/Home.css";
import PatientHome from "../components/Homes/PatientHome";
import AdminHome from "../components/Homes/AdminHome";
import DoctorHome from "../components/Homes/DoctorHome";
import RegistrarHome from "../components/Homes/RegistrarHome";

function Home() {
  const savedUser = localStorage.getItem(USER_INFO);
  const user = savedUser ? JSON.parse(savedUser) : null;

  if (!user) {
    return <Login />;
  }

  const roleComponents = {
    PATIENT: <PatientHome />,
    DOCTOR: <DoctorHome user={user} />,
    ADMIN: <AdminHome user={user} />,
    REGISTRAR: <RegistrarHome user={user} />,
  };

  return roleComponents[user.role] || <div>Роль не распознана</div>;
}
export default Home;

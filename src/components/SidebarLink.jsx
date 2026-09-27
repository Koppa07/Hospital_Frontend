import { NavLink } from "react-router-dom";

function SidebarLink({ to, icon, children, onClick, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
      }
    >
      {icon && <img src={icon} alt="" className="sidebar__icon" />}

      <span>{children}</span>
    </NavLink>
  );
}
export default SidebarLink;

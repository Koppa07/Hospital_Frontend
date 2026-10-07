import { NavLink } from "react-router-dom";

function SidebarLink({
  to,
  icon,
  children,
  onClick,
  end = false,
  disabled = false,
}) {
  const handleClick = (event) => {
    if (disabled) {
      event.preventDefailt();
      event.stopPropagation();
      return;
    }
    onClick?.();
  };
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={({ isActive }) =>
        `sidebar__link ${isActive ? "sidebar__link--active" : ""} ${disabled ? "sidaber__link--disabled" : ""}`
      }
    >
      {icon && <img src={icon} alt="" className="sidebar__icon" />}

      <span>{children}</span>
    </NavLink>
  );
}
export default SidebarLink;

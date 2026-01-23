import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { closeDrawer } from "../drawer/drawerSlice";
import { useLogoutMutation } from "../../app/store/api/authApi";

const NavbarDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation().pathname;
  const closeOnClick = () => dispatch(closeDrawer());
  const [logout] = useLogoutMutation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const classString = (path?: string) =>
    `transition-all py-4 ${location === path ? "text-primary hover:text-accent" : "hover:text-primary"}`;

  const handleLogout = async () => {
    closeOnClick();
    try {
      await logout().unwrap();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-full text-neutral-contrast">
      <Link onClick={closeOnClick} className={classString("/")} to="/">
        Home
      </Link>

      {/* new links inserted here */}

      {!isAuthenticated && (
        <Link onClick={closeOnClick} className="mt-auto btn-primary" to="/auth">
          Login
        </Link>
      )}
      {isAuthenticated && user && (
        <div className="flex flex-col h-full">
          <div className="my-4 h-px w-full bg-neutral-contrast/25" />
          <Link
            onClick={closeOnClick}
            className={classString("/profile")}
            to={`/profile/${user?._id}`}
          >
            Profile
          </Link>
          <Link onClick={handleLogout} className="mt-auto btn-error" to="/auth">
            Logout
          </Link>
        </div>
      )}
    </div>
  );
};

export default NavbarDrawer;

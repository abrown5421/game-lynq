import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bars3Icon, ShoppingBagIcon } from "@heroicons/react/24/solid";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { openDrawer } from "../drawer/drawerSlice";
import { motion } from "framer-motion";
import { PREFABS } from "../../config/prefabs";

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = location.pathname === "/auth";

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good Morning";
    } else if (hour < 19) {
      return "Good Afternoon";
    } else {
      return "Good Evening";
    }
  };

  const handleClick = () => {
    dispatch(
      openDrawer({
        open: true,
        drawerContent: "navbar",
        anchor: "right",
        title: user ? `${getGreeting()}, ${user.firstName}` : getGreeting(),
      }),
    );
  };

  const classString = (path?: string) =>
    `px-4 transition-all ${location.pathname === path ? "text-primary hover:text-accent" : "hover:text-primary"}`;

  return (
    <div className="bg-neutral text-neutral-contrast flex flex-row justify-between items-center px-4 nav relative z-10 border-b border-neutral-contrast/15">
      <Link className="text-xl font-primary" to="/">
        Game<span className="text-primary">Lynq</span>
      </Link>
      
      <div className="hidden lg:flex items-center">

        {/* new links inserted here */}

        {!isAuthenticated && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{
              width: isAuth ? 0 : "auto",
              opacity: isAuth ? 0 : 1,
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden ml-4"
          >
            <Link className="btn-primary" to="/auth">
              Login
            </Link>
          </motion.div>
        )}

        {isAuthenticated && user && (
          <div className="flex items-center ml-4">
            {PREFABS.ecommerce && (
              <div
                onClick={() => navigate("/cart")}
                className="relative w-7 h-7 cursor-pointer"
              >
                <ShoppingBagIcon className="w-full h-full text-secondary" />
              </div>
            )}
            <div
              onClick={handleClick}
              className={`w-10 h-10 ${PREFABS.ecommerce ? "ml-4" : ""} rounded-full flex items-center justify-center cursor-pointer overflow-hidden bg-primary text-primary-contrast text-sm font-semibold`}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>{`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`}</>
              )}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={handleClick}
        className="lg:hidden"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-7 h-7 text-neutral-contrast" />
      </button>
    </div>
  );
};

export default Navbar;

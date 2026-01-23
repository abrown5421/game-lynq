import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/home/Home";
import Auth from "./pages/auth/Auth";
import Navbar from "./features/navbar/Navbar";
import Alert from "./features/alert/Alert";
import Drawer from "./features/drawer/Drawer";
import { useGetCurrentUserQuery } from "./app/store/api/authApi";
import Profile from "./pages/profile/Profile";
import Modal from "./features/modal/Modal";
import Footer from "./features/footer/Footer";
import Loader from "./features/loader/Loader";
import PageNotFound from "./pages/pageNotFound/PageNotFound";
import Host from "./pages/host/Host";
import Join from "./pages/join/Join";
import Genre from "./pages/genre/Genre";
const App: React.FC = () => {
  const location = useLocation();
  const { isLoading } = useGetCurrentUserQuery();
  const adminRoute = location.pathname.startsWith("/admin");

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-neutral-contrast flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-neutral-contrast font-secondary relative">
      {!adminRoute && <Navbar />}
      <div className="minus-nav">
        <AnimatePresence mode="wait">
          <div className={adminRoute ? "flex flex-row" : ""}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile/:id" element={<Profile />} />{" "}
              {/* new routes inserted here */}
              <Route path="/genre" element={<Genre />} />
              <Route path="/join/*" element={<Join />} />
              <Route path="/host/:id" element={<Host />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </div>
        </AnimatePresence>
        <Alert />
        <Drawer />
        <Modal />
        <Footer />
      </div>
    </div>
  );
};

export default App;

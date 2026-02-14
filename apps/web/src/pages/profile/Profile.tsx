import { motion, AnimatePresence } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from "../../app/store/api/usersApi";
import { openAlert } from "../../features/alert/alertSlice";
import Loader from "../../features/loader/Loader";
import { AtSymbolIcon, EyeIcon, TrashIcon } from "@heroicons/react/24/solid";
import GradientBanner from "../../features/gradientBanner/GradientBanner";
import CustomerInfoForm from "../../features/forms/CustomerInfoForm";
import SensitiveInfoForm from "../../features/forms/SensitiveInfoForm";
import { useLoginMutation } from "../../app/store/api/authApi";
import { Address } from "../../types/user.types";
import { useDeleteSessionMutation, useGetSessionsByUserQuery } from "../../app/store/api/sessionsApi";
import SpotifyConnection from '../../features/spotifyConnection/SpotifyConnection';

const DEFAULT_GRADIENT = "linear-gradient(90deg,rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)";

const emptyAddress: Address = {
  addrLine1: "",
  addrLine2: "",
  addrCity: "",
  addrState: "",
  addrZip: 0,
};

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  mailingAddress: Address;
  billingAddress: Address;
  sameAddress: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth);
  const [deleteSession] = useDeleteSessionMutation()
  const params = useParams();
  const {
    data: user,
    isLoading: isUserLoading,
    error,
  } = useGetUserByIdQuery(params?.id!);
  const {
    data: hostedSessions,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useGetSessionsByUserQuery(params?.id!);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const ownProf = authUser.user?._id === params.id;

  const initialGradient = authUser.user?.profileBanner?.gradient || DEFAULT_GRADIENT;
  const [savedGradient, setSavedGradient] = useState(initialGradient);
  const [gradient, setGradient] = useState(initialGradient);
  const [editorOpen, setEditorOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const tabs = ownProf ? (["Home", "Account", "Connections"] as const) : (["Home"] as const);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [loginMutation] = useLoginMutation();
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [passwordVerified, setPasswordVerified] = useState(false);

  const [form, setForm] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    mailingAddress: emptyAddress,
    billingAddress: emptyAddress,
    sameAddress: true,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      bio: user.bio ?? "",
      mailingAddress: user.mailingAddress ?? emptyAddress,
      billingAddress: user.billingAddress ?? emptyAddress,
      sameAddress: user.sameAddress ?? true,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setChangedFields(new Set());
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        setGradient(savedGradient);
        setEditorOpen(false);
      }
    };

    if (editorOpen) {
      document.addEventListener("mousedown", handler);
    }

    return () => document.removeEventListener("mousedown", handler);
  }, [editorOpen, savedGradient]);

  useEffect(() => {
    const el = tabsRef.current[activeTab];
    const container = tabsContainerRef.current;
    if (!el || !container) return;

    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setUnderlineStyle({
      left: rect.left - containerRect.left,
      width: rect.width,
    });
  }, [activeTab]);

  useEffect(() => {
    if (!ownProf && activeTab === "Account") {
      setActiveTab("Home");
    }
  }, [ownProf, activeTab]);

  useEffect(() => {
    if (form.sameAddress) {
      setForm((prev) => ({ ...prev, billingAddress: prev.mailingAddress }));
    }
  }, [form.mailingAddress, form.sameAddress]);

  const handleBannerSave = async (newGradient: string) => {
    try {
      setSavedGradient(newGradient);
      setGradient(newGradient);

      if (!authUser.user?._id) return;

      await updateUser({
        id: authUser.user._id,
        data: { profileBanner: { gradient: newGradient } },
      }).unwrap();
        
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "success",
          message: "Banner updated successfully!",
          anchor: { x: "right", y: "bottom" },
        })
      );
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "There was a problem updating your banner. Please try again later",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    setForm((prev) => {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");

        if (parent === "mailingAddress" || parent === "billingAddress") {
          setChangedFields((fields) => new Set(fields).add(parent));
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: child === "addrZip" ? Number(finalValue) : finalValue,
            },
          };
        }
      }

      if (name === "sameAddress") {
        setChangedFields((fields) => new Set(fields).add("sameAddress"));
        return {
          ...prev,
          sameAddress: finalValue as boolean,
          billingAddress: finalValue ? prev.mailingAddress : prev.billingAddress,
        };
      }

      setChangedFields((fields) => new Set(fields).add(name));
      return { ...prev, [name]: finalValue };
    });
  };

  const handleVerifyPassword = async (currentPassword: string) => {
    try {
      await loginMutation({ email: user!.email, password: currentPassword }).unwrap();
      setPasswordVerified(true);
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "success",
          message: "Password verified",
          anchor: { x: "right", y: "bottom" },
        })
      );
    } catch (err: any) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: err?.data?.message || "Incorrect password",
          anchor: { x: "right", y: "bottom" },
        })
      );
      throw err;
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser.user?._id || changedFields.size === 0) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "info",
          message: "No changes to save",
          anchor: { x: "right", y: "bottom" },
        })
      );
      return;
    }

    const updates: any = {};

    if (changedFields.has("firstName")) updates.firstName = form.firstName;
    if (changedFields.has("lastName")) updates.lastName = form.lastName;
    if (changedFields.has("email")) updates.email = form.email;
    if (changedFields.has("bio")) updates.bio = form.bio;
    if (changedFields.has("mailingAddress")) updates.mailingAddress = form.mailingAddress;
    if (changedFields.has("billingAddress")) updates.billingAddress = form.billingAddress;
    if (changedFields.has("sameAddress")) updates.sameAddress = form.sameAddress;

    if (passwordVerified && changedFields.has("newPassword") && form.newPassword) {
      updates.password = form.newPassword;
    }

    try {
      await updateUser({
        id: authUser.user._id,
        data: updates,
      }).unwrap();

      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "success",
          message: "Profile updated successfully!",
          anchor: { x: "right", y: "bottom" },
        })
      );

      setChangedFields(new Set());
      setPasswordVerified(false);
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "There was a problem updating your profile. Please try again later",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
  };
    
  const isLoading = isUserLoading || isSessionsLoading;
  const isError = !!error || !!sessionsError;

  if (isLoading) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 flex flex-col justify-center items-center p-4 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-red-500 font-primary text-center">
          User Not Found
        </h2>
        <p className="text-neutral-500 text-center">
          Sorry, we couldn't find the user you were looking for.
        </p>
      </div>
    );
  }

  const activeSessions = hostedSessions?.filter(s => s.status !== "ended") || [];
  const inactiveSessions = hostedSessions?.filter(s => s.status === "ended") || [];
  
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId).unwrap();

      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "success",
          message: "Session deleted successfully",
          anchor: { x: "right", y: "bottom" },
        })
      );
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "Failed to delete session",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
  };

  const handleGoToSession = (status: string, _id: string) => {
    if (status === 'lobby') {
      navigate(`/host/${_id}`)
    } else {
      navigate(`/host/${_id}/game`)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 flex flex-col items-center"
    >
      <div className="relative w-full">
        <GradientBanner
          gradient={savedGradient}
          editable={ownProf}
          onSave={handleBannerSave}
          height={220}
        />
        <div
          className="flex flex-col w-full max-w-6xl mx-auto z-25 px-4"
          style={{ marginTop: -60 }}
        >
          <div className="z-25 w-40 h-40 rounded-full overflow-hidden bg-secondary text-primary-contrast text-3xl sm:text-4xl md:text-5xl font-semibold border-4 border-neutral-900 shadow-lg flex items-center justify-center">
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
          <div className="flex flex-col w-full max-w-6xl mx-auto z-25 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex flex-col lg:flex-3">
                <h1 className="text-xl sm:text-2xl font-primary">
                  {user.firstName} {user.lastName}
                </h1>
                <p className='text-neutral-500 mt-2 flex flex-row items-center'>
                  <AtSymbolIcon className='h-4 w-4 sm:h-5 sm:w-5 text-primary mr-2 shrink-0' />
                  <span className="truncate">{user.email}</span>
                </p>
                <div className="block lg:hidden h-px w-full bg-neutral-contrast/25 my-4" />
                <p className="block lg:hidden text-neutral-500 text-sm sm:text-base">
                  {user.bio ? user.bio : "This user has not saved a bio yet"}
                </p>
              </div>
              <div className="flex flex-col lg:flex-8 justify-end lg:px-4">
                <div className="flex flex-row relative">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      ref={(el) => {
                        tabsRef.current[tab] = el;
                      }}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 sm:px-4 py-2 font-medium transition-colors ${
                        activeTab === tab
                          ? "text-primary"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative my-4 w-full" ref={tabsContainerRef}>
              <div className="flex flex-col lg:flex-row">
                <div className="hidden lg:flex lg:flex-3">
                  <div className="h-px w-full bg-neutral-contrast/25" />
                </div>
                <div className="flex flex-col lg:flex-8 lg:px-4">
                  <div className="h-px w-full bg-neutral-contrast/25" />
                </div>
              </div>
              <motion.div
                className="absolute top-0 h-0.5 bg-primary"
                animate={{
                  left: underlineStyle.left,
                  width: underlineStyle.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30,
                }}
              />
            </div>
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-0">
              <div className="hidden lg:flex lg:flex-col lg:flex-3">
                <p className="text-neutral-500 text-sm sm:text-base">
                  {user.bio ? user.bio : "This user has not saved a bio yet"}
                </p>
              </div>
              <div className="flex flex-col lg:flex-8 lg:px-4">
                <AnimatePresence mode="wait">
                  {activeTab === "Home" && (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
                        <h2 className="text-xl font-primary font-bold text-primary mb-4">
                          Active Sessions
                        </h2>
                        {activeSessions.length ? (
                          <ul className="space-y-2">
                            {activeSessions.map((s) => (
                              <li
                                key={s._id}
                                className="p-2 bg-neutral2 rounded-xl border-2 border-neutral-contrast/30 overflow-hidden flex justify-between items-center"
                              >
                                <span className="font-semibold text-accent-contrast">{s.code}</span>
                                <div>
                                  <span
                                    className={`${
                                      s.status === "playing" ? "text-green-400" : "text-accent-contrast"
                                    }`}
                                  >
                                    ( {s.status} ) 
                                  </span>
                                  <button
                                    onClick={() => handleGoToSession(s.status, s._id)}
                                    className={`transition ${ownProf && 'hidden'}`}
                                    title="Delete session"
                                  >
                                    <EyeIcon className="mx-5 w-4 h-4 text-accent cursor-pointer" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSession(s._id)}
                                    className="hover:text-red-400 transition"
                                    title="Delete session"
                                  >
                                    <TrashIcon className="w-4 h-4 text-red-500 cursor-pointer" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-500 text-sm">No active sessions.</p>
                        )}
                      </div>


                      <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
                        <h2 className="text-xl font-primary font-bold text-primary mb-4">
                          Inactive Sessions
                        </h2>
                        {inactiveSessions.length ? (
                          <ul className="space-y-2">
                            {inactiveSessions.map((s) => (
                              <li key={s._id} className="p-2 bg-neutral-800 rounded flex justify-between items-center">
                                <span className="font-semibold">{s.code}</span>
                                <span className="text-sm text-neutral-400">{new Date(s.createdAt).toLocaleString()}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-neutral-500 text-sm">No inactive sessions.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {activeTab === "Account" && ownProf && (
                    <motion.div
                      key="account"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-4"
                    >
                      <CustomerInfoForm
                        firstName={form.firstName}
                        lastName={form.lastName}
                        email={form.email}
                        bio={form.bio}   
                        onChange={handleChange}
                        emailDisabled
                      />
                      
                      <SensitiveInfoForm
                        onVerifyPassword={handleVerifyPassword}
                      />

                      

                      <button 
                        className="btn-primary w-full sm:w-auto text-sm sm:text-base" 
                        onClick={handleSaveProfile}
                        disabled={isSaving || changedFields.size === 0}
                      >
                        {isSaving ? "Saving..." : `Save Profile${changedFields.size > 0 ? ` (${changedFields.size} change${changedFields.size === 1 ? '' : 's'})` : ''}`}
                      </button>
                    </motion.div>
                  )}
                  {activeTab === "Account" && ownProf && (
                    <SpotifyConnection />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
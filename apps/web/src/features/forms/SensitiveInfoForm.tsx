import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import FormInput from "./FormInput";
import Loader from "../loader/Loader";

interface SensitiveInfoFormProps {
  onVerifyPassword: (password: string) => Promise<void>;
}

const SensitiveInfoForm = ({ onVerifyPassword }: SensitiveInfoFormProps) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordFlow, setShowPasswordFlow] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const verifyCurrentPassword = async () => {
    if (!form.currentPassword) {
      setErrors({ currentPassword: "Current password is required" });
      return;
    }

    try {
      setVerifying(true);
      await onVerifyPassword(form.currentPassword);
      setPasswordVerified(true);
      setShowPasswordFlow(true);
    } catch (err: any) {
      setErrors({
        currentPassword: err?.message || "Incorrect password",
      });
    } finally {
      setVerifying(false);
    }
  };

  const validateFinal = () => {
    const nextErrors: Record<string, string> = {};

    if (passwordVerified) {
      if (!form.newPassword) {
        nextErrors.newPassword = "New password is required";
      }
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Please confirm your new password";
      }
      if (form.newPassword !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return (
    <div className="bg-neutral3-contrast rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-semibold font-primary">
        Change Password
      </h2>

      <div className="flex flex-row gap-4">
        <FormInput
          name="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={handleChange}
          placeholder="Enter Current Password"
          error={errors.currentPassword}
          className="w-full"
        />
        {!passwordVerified && (
          <button
            type="button"
            onClick={verifyCurrentPassword}
            disabled={verifying}
            className="btn-primary w-fit max-h-10.5"
          >
            {verifying ? <Loader /> : "Verify"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {showPasswordFlow && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden space-y-3"
          >
            {passwordVerified && (
              <>
                <FormInput
                  name="newPassword"
                  type="password"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="New Password"
                  error={errors.newPassword}
                />
                <FormInput
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm New Password"
                  error={errors.confirmPassword}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SensitiveInfoForm;

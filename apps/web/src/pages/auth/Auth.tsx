import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { openAlert } from '../../features/alert/alertSlice';
import { useAppDispatch } from '../../app/store/hooks';
import { useLoginMutation, useRegisterMutation } from '../../app/store/api/authApi';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate()
  const [login, setLogin] = useState<boolean>(true);

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
  });

  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: registerLoading }] = useRegisterMutation();

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    let valid = true;
    const newErrors = { email: '', password: '', firstName: '', lastName: '', confirmPassword: '' };

    if (!form.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!form.email.includes('@') || !form.email.includes('.')) {
      newErrors.email = 'Email must be valid';
      valid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    if (!login) {
      if (!form.firstName) {
        newErrors.firstName = 'First name is required';
        valid = false;
      }
      if (!form.confirmPassword) {
        newErrors.confirmPassword = 'Confirm password is required';
        valid = false;
      }
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        valid = false;
      }
    }

    setErrors(newErrors);

    if (!valid) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: 'Please fix the errors in the form',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (login) {
        const response = await loginMutation({ email: form.email, password: form.password }).unwrap();
        dispatch(
          openAlert({
            open: true,
            closeable: true,
            severity: 'success',
            message: `Welcome back ${response.firstName}!`,
            anchor: { x: 'right', y: 'bottom' },
          })
        );
        navigate('/');
      } else {
        const response = await registerMutation({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName || '',
        }).unwrap();
        dispatch(
          openAlert({
            open: true,
            closeable: true,
            severity: 'success',
            message: `Welcome ${response.firstName}!`,
            anchor: { x: 'right', y: 'bottom' },
          })
        );
        navigate('/');
        setLogin(true);
        setForm({ email: '', password: '', firstName: '', lastName: '', confirmPassword: '' });
      }
    } catch (err: any) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: err?.data?.message || 'Something went wrong. Please try again.',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-neutral-contrast sup-min-nav relative z-0 p-4 flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={login ? 'login' : 'signup'}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="bg-neutral text-neutral-contrast w-full md:w-1/2 lg:w-1/3 p-6 rounded-xl shadow-md"
        >
          <div className="text-xl font-primary text-center mb-4">{login ? 'Login' : 'Sign Up'}</div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col">
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`input-primary ${errors.email ? 'border-red-500' : 'border-gray-300'} `}
              />
              {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
            </div>

            {!login && (
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`input-primary ${errors.firstName ? 'border-red-500' : 'border-gray-300'} `}
                />
                {errors.firstName && <span className="text-red-500 text-sm mt-1">{errors.firstName}</span>}
              </div>
            )}

            {!login && (
              <div className="flex flex-col">
                <input
                  type="text"
                  placeholder="Last Name (Optional)"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="input-primary border-gray-300 "
                />
              </div>
            )}

            <div className="flex flex-col relative">
              <input
                type={showPassword.password ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`input-primary ${errors.password ? 'border-red-500' : 'border-gray-300'}  pr-10`}
              />
              <div
                className="absolute right-2 top-2 cursor-pointer w-6 h-6 text-gray-600"
                onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
              >
                {showPassword.password ? <EyeSlashIcon /> : <EyeIcon />}
              </div>
              {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
            </div>

            {!login && (
              <div className="flex flex-col relative">
                <input
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`input-primary ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}  pr-10`}
                />
                <div
                  className="absolute right-2 top-2 cursor-pointer w-6 h-6 text-gray-600"
                  onClick={() => setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })}
                >
                  {showPassword.confirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </div>
                {errors.confirmPassword && <span className="text-red-500 text-sm mt-1">{errors.confirmPassword}</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading || registerLoading}
              className="btn-primary"
            >
              {login ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => setLogin((prev) => !prev)}
              className="text-primary hover:underline text-sm cursor-pointer"
            >
              {login ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Auth;

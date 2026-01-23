
export const contactTemplate = () => `import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { useEffect, useState } from 'react';
import { openAlert } from '../../features/alert/alertSlice';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  body: string;
}

interface FormErrors {
  [key: string]: string;
}

const Contact = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<ContactForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    subject: '',
    body: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }));
    }
  }, [user]);

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!form.firstName.match(/^[A-Za-z]+$/)) {
      newErrors.firstName = 'First name must be alphabetical';
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!form.email.includes('@') || !form.email.includes('.')) {
      newErrors.email = 'Email must be valid';
    }

    if (!form.subject) newErrors.subject = 'Subject is required';
    if (!form.body) newErrors.body = 'Message body is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'success',
          message: 'Your message has been sent successfully!',
          anchor: { x: 'right', y: 'bottom' },
        })
      );
    } else {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: 'error',
          message: 'There was a problem with your form.',
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
      className="bg-neutral sup-min-nav relative z-0 p-4 flex flex-col items-center"
    >
      <div className="max-w-6xl w-full">
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold font-primary">
            Contact Us
          </h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block mb-1 font-medium" htmlFor="firstName">First Name</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              className={\`input-primary w-full \${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}\`}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="lastName">Last Name (optional)</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="input-primary w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={\`input-primary w-full \${errors.email ? 'border-red-500 focus:ring-red-500' : ''}\`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="subject">Subject</label>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              className={\`input-primary w-full \${errors.subject ? 'border-red-500 focus:ring-red-500' : ''}\`}
            />
            {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="block mb-1 font-medium" htmlFor="body">Message</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              className={\`input-primary w-full h-32 resize-none \${errors.body ? 'border-red-500 focus:ring-red-500' : ''}\`}
            />
            {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body}</p>}
          </div>

          <button type="submit" className="btn-primary">
            Send Message
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default Contact;
`;
import FormInput from "./FormInput";

interface CustomerInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  errors?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emailDisabled?: boolean;
}

const CustomerInfoForm = ({
  firstName,
  lastName,
  email,
  bio,
  errors,
  onChange,
  emailDisabled = false,
}: CustomerInfoFormProps) => {
  return (
    <div className="bg-neutral2 rounded-xl border-2 border-neutral-contrast/10 p-4">
      <h2 className="text-xl font-primary font-bold text-primary mb-4">
        Customer Information
      </h2>

      <div className="grid md:grid-cols-2 gap-4">
        <FormInput
          name="firstName"
          value={firstName}
          onChange={onChange}
          placeholder="First Name"
          error={errors?.firstName}
        />
        <FormInput
          name="lastName"
          value={lastName}
          onChange={onChange}
          placeholder="Last Name"
          error={errors?.lastName}
        />
        <FormInput
          name="email"
          value={email}
          onChange={onChange}
          placeholder="Email"
          error={errors?.email}
          className="md:col-span-2"
          type="email"
        />
        <FormInput
          name="bio"
          value={bio}
          onChange={onChange}
          placeholder="Bio"
          className="md:col-span-2"
        />
      </div>
    </div>
  );
};

export default CustomerInfoForm;

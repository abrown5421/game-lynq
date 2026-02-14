interface FormInputProps {
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

const FormInput = ({
  name,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  className = "",
  inputRef,
}: FormInputProps) => (
  <div className={`flex flex-col ${className}`}>
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`input-primary ${
        error ? "border-red-500" : "unset"
      }`}
    />
    {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
  </div>
);

export default FormInput;

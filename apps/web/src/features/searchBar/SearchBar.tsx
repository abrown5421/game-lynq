import React, { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <input
      type="text"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
};

export default SearchBar;

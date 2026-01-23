import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral flex justify-center items-center px-4 py-3 nav relative z-10 border-t border-neutral-contrast/15">
      <p className="text-sm text-neutral-600">
        © {year} All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;

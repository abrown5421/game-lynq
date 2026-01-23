import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: number[] = [];

    let start = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let end = start + maxVisiblePages - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="flex justify-center mt-6 space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="cursor-pointer flex md:w-full justify-center items-center px-4 py-2 border-2 border-transparent bg-gray-500 text-accent-contrast rounded hover:bg-transparent hover:text-gray-500 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Prev
      </button>

      {getPageNumbers().map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`cursor-pointer flex md:w-full justify-center items-center p-2 border-2 border-transparent rounded hover:bg-transparent hover:text-primary hover:border-primary transition-all ${
            currentPage === page ? 'bg-primary text-neutral' : 'text-primary'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="cursor-pointer flex md:w-full justify-center items-center px-4 py-2 border-2 border-transparent bg-gray-500 text-accent-contrast rounded hover:bg-transparent hover:text-gray-500 hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

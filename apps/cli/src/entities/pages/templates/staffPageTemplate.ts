export const staffTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useGetEditorsAndAdminsQuery } from '../../app/store/api/usersApi';
import { useState, useMemo } from 'react';
import Loader from '../../features/loader/Loader';
import Pagination from '../../features/pagination/Pagination';

const ITEMS_PER_PAGE = 8;

const ${pageName} = () => {
  const { data: staffUsers, isLoading, error } = useGetEditorsAndAdminsQuery();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((staffUsers?.length || 0) / ITEMS_PER_PAGE);
  const paginatedStaff = useMemo(() => {
    if (!staffUsers) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return staffUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [staffUsers, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (error || !staffUsers) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 flex flex-col justify-center items-center p-8">
        <h2 className="text-2xl font-semibold mb-2 text-red-500 font-primary">
          Staff Members Not Found
        </h2>
        <p className="text-neutral-500">
          Sorry, we couldn't find the staff members you were looking for.
        </p>
      </div>
    );
  }

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
            Our Staff
          </h1>
        </div>

        {paginatedStaff.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 font-semibold text-lg">
            No staff members available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedStaff.map((staff) => (
              <motion.div
                key={staff._id}
                whileHover={{ y: -4 }}
                className="relative bg-white rounded-xl shadow-md overflow-hidden group"
              >
                <div className="w-full h-56 bg-gray-200">
                  <img
                    src={staff.profileImage || "/assets/images/pfp_placeholder.png"}
                    alt={staff.firstName + " " + staff.lastName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 flex flex-col gap-1 text-center">
                  <h3 className="text-lg font-semibold font-primary">
                    {staff.firstName} {staff.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 break-all">
                    {staff.email}
                  </p>
                </div>

                <div className="absolute inset-0 bg-black/80 flex items-center justify-center px-4 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-col">
                  <p className='text-white text-lg font-bold'>
                    {staff.firstName + ' ' + staff.lastName}
                  </p>
                  <div className="my-4 h-px w-full bg-white/35" />
                  <p className="text-white text-sm leading-relaxed max-h-full overflow-y-auto">
                    {staff.bio || 'No bio available.'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </motion.div>
  );
};

export default ${pageName};
`;
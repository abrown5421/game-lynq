export const blogPostTemplate = (pageName: string) => `import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetBlogPostByIdQuery } from '../../app/store/api/blogPostsApi';
import Loader from '../../features/loader/Loader';

const ${pageName} = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useGetBlogPostByIdQuery(id!);

  if (isLoading) return (<div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center"><Loader /></div>);

if (error || !post) {
    return (
      <div className="bg-neutral sup-min-nav relative z-0 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold mb-2 text-red-500 font-primary">Blog post Not Found</h2>
        <p className="text-neutral-500">
          Sorry, we couldn't find the blog post you were looking for.
        </p>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={() => navigate('/blog')}
        >
          Back to Blog
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 flex flex-col items-center"
    >
      {post.post_image && (
        <div className="relative w-full h-80 sm:h-96">
          <img
            src={post.post_image}
            alt={post.post_title}
            className="w-full h-full object-cover"
          />
          {post.post_category && (
            <div className="absolute top-5 right-5 bg-neutral text-neutral-contrast p-5 py-1 rounded-lg">
              {post.post_category}
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-4xl p-4 flex flex-col gap-6">
        <h1 className="text-4xl font-bold font-primary">{post.post_title}</h1>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>By {post.post_author}</span>
          <span>
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <p className="mt-6 text-gray-700 whitespace-pre-line">
           <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.post_body }}
            />
        </p>
      </div>
    </motion.div>
  );
};

export default ${pageName};
`
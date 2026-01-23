export function pageTemplate(pageName: string): string {
  return `import { motion } from 'framer-motion';

const ${pageName} = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4"
    >
      ${pageName}
    </motion.div>
  );
};

export default ${pageName};
`;
}

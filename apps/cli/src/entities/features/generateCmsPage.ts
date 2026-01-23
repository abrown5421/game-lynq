import { toCamelCase } from "../../shared/case.js";

interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  enum?: string[];
}

interface FeatureSchema {
  name: string;
  fields: FieldDefinition[];
}

export function generateCmsPage(schema: FeatureSchema): string {
  const camelName = toCamelCase(schema.name);
  const pluralCamelName = `${camelName}s`;
  const capitalizedName = schema.name;
  const capitalizedPlural = `${schema.name}s`;

  const searchKeys = schema.fields
    .filter(f => f.type === 'String')
    .map(f => `'${f.name}'`)
    .slice(0, 3); 

  const columns = schema.fields
    .slice(0, 5)
    .map((field, idx) => {
      const hideOnSmall = idx > 1;
      
      if (field.type === 'Date') {
        return `{ key: '${field.name}', label: '${formatLabel(field.name)}', render: (item) => new Date(item.${field.name}).toLocaleDateString(), hideOnSmall: ${hideOnSmall} }`;
      } else if (field.type === 'Boolean') {
        return `{ key: '${field.name}', label: '${formatLabel(field.name)}', render: (item) => item.${field.name} ? 'Yes' : 'No', hideOnSmall: ${hideOnSmall} }`;
      } else {
        return `{ key: '${field.name}', label: '${formatLabel(field.name)}', hideOnSmall: ${hideOnSmall} }`;
      }
    });

  if (!schema.fields.some(f => f.name === 'createdAt')) {
    columns.push(`{ key: 'createdAt', label: 'Created', render: (item) => new Date(item.createdAt).toLocaleDateString(), hideOnSmall: true }`);
  }

  return `import { motion } from 'framer-motion';
import { useDelete${capitalizedName}Mutation, useGet${capitalizedPlural}Query } from '../../app/store/api/${pluralCamelName}Api';
import Loader from '../../features/loader/Loader';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../../app/store/hooks';
import { I${capitalizedName} } from '../../types/${camelName}.types';
import { openModal } from '../../features/modal/modalSlice';
import CollectionEditor from '../../features/collection/CollectionEditor';
import CollectionViewer from '../../features/collection/CollectionViewer';

const Admin${capitalizedName} = () => {
  const dispatch = useAppDispatch();
  const { data: ${pluralCamelName} = [], isLoading } = useGet${capitalizedPlural}Query();
  const [delete${capitalizedName}] = useDelete${capitalizedName}Mutation();
  const { id } = useParams();
  const isNew = location.pathname.endsWith('/new');

  if (isLoading) return <Loader />;

  const handleDelete = (item: I${capitalizedName}) => {
    dispatch(
      openModal({
        modalContent: 'confirm',
        title: 'Delete ${capitalizedName}',
        message: 'This action is permanent and cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmAction: async () => {
          try {
            await delete${capitalizedName}(item._id).unwrap();
          } catch (err) {
            console.error('Delete failed', err);
          }
        },
      })
    );
  };

  if (isNew) {
    return <CollectionEditor mode="create" featureType="${camelName}" />;
  }

  if (id) {
    return <CollectionEditor mode="edit" id={id} featureType="${camelName}" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral relative z-0 p-4 flex flex-8 sup-min-nav "
    >
      <CollectionViewer
        featureName='${camelName}'
        data={${pluralCamelName}}
        searchKeys={[${searchKeys.join(', ')}]}
        columns={[
          ${columns.join(',\n          ')}
        ]}
        onEdit={(${camelName}) => console.log('Edit', ${camelName})}
        onDelete={(${camelName}) => handleDelete(${camelName})}
      />
    </motion.div>
  );
};

export default Admin${capitalizedName};
`;
}

function formatLabel(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
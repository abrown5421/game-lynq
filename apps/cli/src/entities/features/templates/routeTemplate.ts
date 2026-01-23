import { toCamelCase } from "../../../shared/case.js";

interface FeatureSchema {
  name: string;
  fields: any[];
}

export function generateRoute(schema: FeatureSchema): string {
  const camelName = toCamelCase(schema.name);
  
  const hasPassword = schema.fields.some(f => f.name === 'password');
  
  const passwordHooks = hasPassword
    ? `, {
  preCreate: async (data) => {
    if (data.password) data.password = await hashPassword(data.password);
    return data;
  },
  preUpdate: async (data) => {
    if (data.password) data.password = await hashPassword(data.password);
    return data;
  },
}`
    : '';

  const passwordImport = hasPassword
    ? `\nimport { hashPassword } from '../shared/password';`
    : '';

  return `import { ${schema.name}Model } from '../entities/${camelName}/${camelName}.model';
import { createBaseCRUD } from '../shared/base';${passwordImport}

const ${camelName}Router = createBaseCRUD(${schema.name}Model${passwordHooks});

export default ${camelName}Router;
`;
}
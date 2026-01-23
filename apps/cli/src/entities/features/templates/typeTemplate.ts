type FieldType = 'String' | 'Number' | 'Boolean' | 'Date' | 'ObjectId' | 'Array' | 'Mixed';

interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  default?: string;
  enum?: string[];
  ref?: string;
}

interface FeatureSchema {
  name: string;
  fields: FieldDefinition[];
}

export function generateTypeDefinitions(schema: FeatureSchema): string {
  const interfaceName = `I${schema.name}`;
  
  const interfaceFields = schema.fields
    .map(field => {
      let tsType = mongooseTypeToTS(field.type);
      const optional = !field.required ? '?' : '';
      return `  ${field.name}${optional}: ${tsType};`;
    })
    .join('\n');

  const createFields = schema.fields
    .map(field => {
      let tsType = mongooseTypeToTS(field.type);
      const optional = !field.required ? '?' : '';
      return `  ${field.name}${optional}: ${tsType};`;
    })
    .join('\n');

  const updateFields = schema.fields
    .map(field => {
      let tsType = mongooseTypeToTS(field.type);
      return `  ${field.name}?: ${tsType};`;
    })
    .join('\n');

  return `export interface ${interfaceName} {
  _id: string;
${interfaceFields}
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${schema.name}Dto {
${createFields}
}

export interface Update${schema.name}Dto {
${updateFields}
}
`;
}

function mongooseTypeToTS(type: FieldType): string {
  switch (type) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'Date';
    case 'ObjectId':
      return 'string';
    case 'Array':
      return 'any[]';
    case 'Mixed':
      return 'any';
    default:
      return 'any';
  }
}
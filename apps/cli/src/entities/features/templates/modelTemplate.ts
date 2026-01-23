import { toCamelCase } from "../../../shared/case.js";

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

export function generateModel(schema: FeatureSchema, addTimestamps: boolean): string {
  const camelName = toCamelCase(schema.name);
  const interfaceName = `I${schema.name}`;
  
  const interfaceFields = schema.fields
    .map(field => {
      let tsType = mongooseTypeToTS(field);
      const optional = !field.required ? '?' : '';
      return `  ${field.name}${optional}: ${tsType};`;
    })
    .join('\n');

  const schemaFields = schema.fields
    .map(field => {
      const fieldDef = buildMongooseFieldDef(field);
      return `    ${field.name}: ${fieldDef},`;
    })
    .join('\n');

  const timestampFields = addTimestamps
    ? '\n  createdAt: Date;\n  updatedAt: Date;'
    : '';

  const timestampOption = addTimestamps
    ? ',\n  { timestamps: true }'
    : '';

  return `import mongoose, { Schema, Document } from 'mongoose';

export interface ${interfaceName} extends Document {
${interfaceFields}${timestampFields}
}

const ${schema.name}Schema: Schema<${interfaceName}> = new Schema(
  {
${schemaFields}
  }${timestampOption}
);

export const ${schema.name}Model = mongoose.model<${interfaceName}>('${schema.name}', ${schema.name}Schema);
`;
}

function mongooseTypeToTS(field: FieldDefinition): string {
  switch (field.type) {
    case 'String':
      return 'string';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'Date';

    case 'ObjectId':
      return 'mongoose.Types.ObjectId';

    case 'Array':
      if (field.ref) {
        return 'mongoose.Types.ObjectId[]';
      }
      return 'any[]';

    case 'Mixed':
    default:
      return 'any';
  }
}

function buildMongooseFieldDef(field: FieldDefinition): string {
  if (field.type === 'Array') {
    if (field.ref) {
      return `[
        {
          type: Schema.Types.ObjectId,
          ref: '${field.ref}',
          ${field.required ? 'required: true,' : ''}
        }
      ]`;
    }

    return `{ type: [Schema.Types.Mixed], ${field.required ? 'required: true' : ''} }`;
  }

  const parts: string[] = [];

  if (field.type === 'ObjectId') {
    parts.push('type: Schema.Types.ObjectId');
  } else {
    parts.push(`type: ${field.type}`);
  }

  if (field.required) parts.push('required: true');
  if (field.unique) parts.push('unique: true');

  if (field.default !== undefined) {
    if (['Boolean', 'Number'].includes(field.type)) {
      parts.push(`default: ${field.default}`);
    } else {
      parts.push(`default: '${field.default}'`);
    }
  }

  if (field.enum?.length) {
    parts.push(`enum: [${field.enum.map(v => `'${v}'`).join(', ')}]`);
  }

  if (field.ref) {
    parts.push(`ref: '${field.ref}'`);
  }

  return `{ ${parts.join(', ')} }`;
}
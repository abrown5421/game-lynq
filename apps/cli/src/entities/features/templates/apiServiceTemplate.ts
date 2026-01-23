import { toCamelCase } from "../../../shared/case.js";

interface FeatureSchema {
  name: string;
  fields: any[];
}

export function generateApiService(schema: FeatureSchema): string {
  const camelName = toCamelCase(schema.name);
  const pluralCamelName = `${camelName}s`;
  const capitalizedPlural = schema.name + 's';
  
  return `import { Create${schema.name}Dto, I${schema.name}, Update${schema.name}Dto } from '../../../types/${camelName}.types';
import { baseApi } from './baseApi';

export const ${pluralCamelName}Api = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    get${capitalizedPlural}: builder.query<I${schema.name}[], void>({
      query: () => '/${pluralCamelName}',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: '${schema.name}' as const, id: _id })),
              { type: '${schema.name}', id: 'LIST' },
            ]
          : [{ type: '${schema.name}', id: 'LIST' }],
    }),

    get${schema.name}ById: builder.query<I${schema.name}, string>({
      query: (id) => \`/${pluralCamelName}/\${id}\`,
      providesTags: (result, error, id) => [{ type: '${schema.name}', id }],
    }),

    create${schema.name}: builder.mutation<I${schema.name}, Create${schema.name}Dto>({
      query: (data) => ({
        url: '/${pluralCamelName}',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: '${schema.name}', id: 'LIST' }],
    }),

    update${schema.name}: builder.mutation<I${schema.name}, { id: string; data: Update${schema.name}Dto }>({
      query: ({ id, data }) => ({
        url: \`/${pluralCamelName}/\${id}\`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: '${schema.name}', id },
        { type: '${schema.name}', id: 'LIST' },
      ],
    }),

    delete${schema.name}: builder.mutation<void, string>({
      query: (id) => ({
        url: \`/${pluralCamelName}/\${id}\`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: '${schema.name}', id },
        { type: '${schema.name}', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGet${capitalizedPlural}Query,
  useGet${schema.name}ByIdQuery,
  useCreate${schema.name}Mutation,
  useUpdate${schema.name}Mutation,
  useDelete${schema.name}Mutation,
  useLazyGet${capitalizedPlural}Query,
  useLazyGet${schema.name}ByIdQuery,
} = ${pluralCamelName}Api;
`;
}
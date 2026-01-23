import fs from "node:fs";
import path from "node:path";
import { input, confirm, select } from "@inquirer/prompts";
import { isPascalCase, toCamelCase } from "../../shared/case.js";
import { webSrc, repoRoot } from "../../shared/paths.js";
import { generateModel } from "./templates/modelTemplate.js";
import { generateRoute } from "./templates/routeTemplate.js";
import { generateApiService } from "./templates/apiServiceTemplate.js";
import { generateTypeDefinitions } from "./templates/typeTemplate.js";
import { generateCmsPage } from "./generateCmsPage.js";
import { updateServerFile } from "./updateServerFile.js";
import { updateBaseApi } from "./updateBaseApi.js";
import { updateAdminSidebar } from "./updateAdminSidebar.js";
import { updateAppRoutes } from "./updateAppRoutes.js";
import { registerCollection, FeatureSchema } from "./registerCollection.js"; 
import prettier from "prettier";

type AddFeatureOptions = {
  featureName?: string;
  schema?: FeatureSchema;
  schemaInputMethod?: "interactive" | "json";
  addTimestamps?: boolean;
  addToCms?: boolean;
};

type FieldType =
  | "String"
  | "Number"
  | "Boolean"
  | "Date"
  | "ObjectId"
  | "Array"
  | "Mixed";

interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  default?: string;
  enum?: string[];
  ref?: string;
}

function isPlural(word: string): boolean {
  const lower = word.toLowerCase();
  if (lower.endsWith("ies")) return true;
  if (lower.endsWith("ses")) return true;
  if (lower.endsWith("s") && !lower.endsWith("ss")) return true;
  return false;
}

export async function addFeature(options: AddFeatureOptions = {}) {
  const featureName =
    options.featureName ??
    (await (async () => {
      while (true) {
        const name = await input({
          message:
            'Enter feature name (PascalCase, singular — e.g. "Product"):',
          validate: (value) => {
            if (!isPascalCase(value)) return "Feature name must be PascalCase";
            if (isPlural(value))
              return 'Feature name must be singular (e.g. "Product")';
            return true;
          },
        });

        const confirmName = await confirm({
          message: `Create feature "${name}"?`,
          default: true,
        });

        if (confirmName) return name;
      }
    })());

  const camelName = toCamelCase(featureName);
  const pluralCamelName = `${camelName}s`;

  const apiRoot = path.join(repoRoot, "apps/api/src");
  const backendFeatureDir = path.join(apiRoot, "entities", camelName);
  const frontendFeatureDir = path.join(webSrc, "app", "store", "api");
  const apiFile = path.join(frontendFeatureDir, `${pluralCamelName}Api.ts`);
  const cmsPageDir = path.join(webSrc, "pages", `admin${featureName}`);

  if (fs.existsSync(backendFeatureDir))
    throw new Error(`Backend feature "${featureName}" already exists`);
  if (fs.existsSync(apiFile))
    throw new Error(`Frontend API service already exists`);
  if (fs.existsSync(cmsPageDir))
    throw new Error(`CMS page already exists`);

  const schema =
    options.schema ??
    (await (async () => {
      const inputMethod =
        options.schemaInputMethod ??
        (await select({
          message: "How would you like to define the feature schema?",
          choices: [
            { name: "Interactive (step-by-step)", value: "interactive" },
            { name: "JSON input", value: "json" },
          ],
        }));

      return inputMethod === "json"
        ? await getSchemaFromJson(featureName)
        : await getSchemaInteractively(featureName);
    })());

  const addTimestamps =
    options.addTimestamps ??
    (await confirm({
      message: "Add createdAt and updatedAt timestamps?",
      default: true,
    }));

  const addToCms =
    options.addToCms ??
    (await confirm({
      message: "Add CMS interface for this feature?",
      default: true,
    }));

  await generateBackendFiles(schema, addTimestamps, apiRoot);
  await generateFrontendFiles(schema);
  await updateBaseApi(featureName, webSrc);
  await updateServerFile(camelName, pluralCamelName, apiRoot);

  if (addToCms) {
    fs.mkdirSync(cmsPageDir, { recursive: true });
    const cmsPageContent = generateCmsPage(schema);
    const cmsPageFile = path.join(cmsPageDir, `Admin${featureName}.tsx`);
    fs.writeFileSync(
      cmsPageFile,
      await prettier.format(cmsPageContent, { parser: "typescript" })
    );

    await updateAppRoutes(featureName, webSrc);
    await updateAdminSidebar(featureName, webSrc);
  }

  await registerCollection(schema);

  console.log(`\n Feature "${featureName}" has been successfully created!`);
}

async function getSchemaFromJson(featureName: string): Promise<FeatureSchema> {
  const jsonInput = await input({
    message: "Paste your JSON schema:",
    validate: (value) => {
      try { JSON.parse(value); return true; } 
      catch { return "Invalid JSON format"; }
    },
  });

  const parsed = JSON.parse(jsonInput);
  if (!parsed.fields || !Array.isArray(parsed.fields)) throw new Error('JSON must contain a "fields" array');

  return { name: featureName, fields: parsed.fields };
}

async function getSchemaInteractively(featureName: string): Promise<FeatureSchema> {
  const fields: FieldDefinition[] = [];
  let addMore = true;

  while (addMore) {
    const fieldName = await input({
      message: `Field name (camelCase):`,
      validate: (value) => value.length > 0 || "Field name cannot be empty",
    });

    const fieldType = await select<FieldType>({
      message: "Field type:",
      choices: [
        { name: "String", value: "String" },
        { name: "Number", value: "Number" },
        { name: "Boolean", value: "Boolean" },
        { name: "Date", value: "Date" },
        { name: "ObjectId (reference)", value: "ObjectId" },
        { name: "Array", value: "Array" },
        { name: "Mixed (any)", value: "Mixed" },
      ],
    });

    const required = await confirm({ message: "Is this field required?", default: false });

    const field: FieldDefinition = { name: fieldName, type: fieldType, required };

    if (fieldType === "String") {
      if (await confirm({ message: "Should this field be unique?", default: false })) field.unique = true;
      if (await confirm({ message: "Does this field have enum values?", default: false })) {
        const enumInput = await input({ message: "Enter enum values (comma-separated):" });
        field.enum = enumInput.split(",").map((v) => v.trim());
      }
    }

    if (fieldType === "ObjectId") field.ref = await input({ message: 'Reference model name (e.g., "User"):' });

    if (await confirm({ message: "Set a default value?", default: false })) field.default = await input({ message: "Default value:" });

    fields.push(field);
    addMore = await confirm({ message: "Add another field?", default: true });
  }

  return { name: featureName, fields };
}

async function generateBackendFiles(schema: FeatureSchema, addTimestamps: boolean, apiRoot: string) {
  const camelName = toCamelCase(schema.name);
  const backendFeatureDir = path.join(apiRoot, "entities", camelName);
  fs.mkdirSync(backendFeatureDir, { recursive: true });

  const modelContent = generateModel(schema, addTimestamps);
  fs.writeFileSync(path.join(backendFeatureDir, `${camelName}.model.ts`), await prettier.format(modelContent, { parser: "typescript" }));

  const routeContent = generateRoute(schema);
  const routeDir = path.join(apiRoot, "routes");
  const routeFile = path.join(routeDir, `${camelName}s.routes.ts`);
  fs.writeFileSync(routeFile, await prettier.format(routeContent, { parser: "typescript" }));
}

async function generateFrontendFiles(schema: FeatureSchema) {
  const camelName = toCamelCase(schema.name);
  const pluralCamelName = `${camelName}s`;

  const typesDir = path.join(webSrc, "types");
  if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir, { recursive: true });
  const typeContent = generateTypeDefinitions(schema);
  fs.writeFileSync(path.join(typesDir, `${camelName}.types.ts`), await prettier.format(typeContent, { parser: "typescript" }));

  const apiDir = path.join(webSrc, "app", "store", "api");
  const apiContent = generateApiService(schema);
  fs.writeFileSync(path.join(apiDir, `${pluralCamelName}Api.ts`), await prettier.format(apiContent, { parser: "typescript" }));

}

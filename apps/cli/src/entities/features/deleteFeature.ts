import fs from "node:fs";
import path from "node:path";
import { input, confirm, select } from "@inquirer/prompts";
import { isPascalCase, toCamelCase } from "../../shared/case.js";
import { webSrc, repoRoot } from "../../shared/paths.js";
import { removeAppRoutes } from "./updateAppRoutes.js";
import { removeAdminSidebarLink } from "./updateAdminSidebar.js";
import { removeFromBaseApi } from "./updateBaseApi.js";
import { removeFromServerFile } from "./updateServerFile.js";
import { unregisterCollection } from "./registerCollection.js";

export type DeleteFeatureOptions = {
  featureName?: string;
  skipConfirm?: boolean;
};

export async function deleteFeature(options: DeleteFeatureOptions = {}) {
  const apiRoot = path.join(repoRoot, "apps/api/src");
  const entitiesDir = path.join(apiRoot, "entities");

  let existingFeatures: string[] = [];
  if (fs.existsSync(entitiesDir)) {
    existingFeatures = fs
      .readdirSync(entitiesDir)
      .filter((item) =>
        fs.statSync(path.join(entitiesDir, item)).isDirectory()
      )
      .map((dir) => dir.charAt(0).toUpperCase() + dir.slice(1));
  }

  if (existingFeatures.length === 0) {
    console.log("  No features found to delete");
    return;
  }

  const featureName =
    options.featureName ??
    (await (async () => {
      const selectionMethod = await select({
        message: "How would you like to select the feature to delete?",
        choices: [
          { name: "Choose from list", value: "list" },
          { name: "Enter manually", value: "manual" },
        ],
      });

      if (selectionMethod === "list") {
        return await select({
          message: "Select feature to delete:",
          choices: existingFeatures.map((f) => ({
            name: f,
            value: f,
          })),
        });
      }

      return await input({
        message:
          'Enter feature name to delete (PascalCase, e.g. "Product"):',
        validate: (value) =>
          isPascalCase(value) || "Feature name must be PascalCase",
      });
    })());

  const camelName = toCamelCase(featureName);
  const pluralCamelName = `${camelName}s`;

  const backendFeatureDir = path.join(apiRoot, "entities", camelName);
  const frontendApiFile = path.join(
    webSrc,
    "app",
    "store",
    "api",
    `${pluralCamelName}Api.ts`
  );
  const frontendTypesFile = path.join(
    webSrc,
    "types",
    `${camelName}.types.ts`
  );
  const cmsPageDir = path.join(webSrc, "pages", `admin${featureName}`);
  const routeFile = path.join(
    apiRoot,
    "routes",
    `${pluralCamelName}.routes.ts`
  );

  const checks = {
    backend: fs.existsSync(backendFeatureDir),
    route: fs.existsSync(routeFile),
    frontendApi: fs.existsSync(frontendApiFile),
    frontendTypes: fs.existsSync(frontendTypesFile),
    cms: fs.existsSync(cmsPageDir),
  };

  if (!Object.values(checks).some(Boolean)) {
    console.log(`  Feature "${featureName}" does not appear to exist`);
    return;
  }

  if (!options.skipConfirm) {
    const confirmDelete = await confirm({
      message: `Are you sure you want to delete feature "${featureName}"? This cannot be undone.`,
      default: false,
    });

    if (!confirmDelete) {
      console.log("\n  Deletion cancelled");
      return;
    }
  }

  if (checks.backend) fs.rmSync(backendFeatureDir, { recursive: true, force: true });
  if (checks.route) fs.unlinkSync(routeFile);
  if (checks.frontendApi) fs.unlinkSync(frontendApiFile);
  if (checks.frontendTypes) fs.unlinkSync(frontendTypesFile);
  if (checks.cms) fs.rmSync(cmsPageDir, { recursive: true, force: true });

  const safe = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.log(
        `${label} failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  await safe("Removed route from server.ts", () =>
    removeFromServerFile(camelName, pluralCamelName, apiRoot)
  );

  await safe("Removed tag type from baseApi.ts", () =>
    removeFromBaseApi(featureName, webSrc)
  );

  await safe("Removed routes from App.tsx", () =>
    removeAppRoutes(featureName, webSrc)
  );

  await safe("Removed link from AdminSidebar.tsx", () =>
    removeAdminSidebarLink(featureName, webSrc)
  );

  await safe("Removed from collection registry", () =>
    unregisterCollection(camelName, webSrc)
  );

  console.log(`\n Feature "${featureName}" has been successfully deleted!`);
}
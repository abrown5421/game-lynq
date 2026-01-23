import fs from 'node:fs';
import path from 'node:path';
import { input, confirm } from '@inquirer/prompts';
import { isPascalCase, toCamelCase } from '../../shared/case.js';
import { pagesDir } from '../../shared/paths.js';
import { updateAppRoutes } from './updateAppRoutes.js';
import { updateNavbar } from './updateNavbar.js';
import { templates } from './templates/templateRegistry.js';

export type AddPageOptions = {
  pageName?: string;
  routePath?: string;
  addToNavbar?: boolean;
  template?: (pageName: string) => string; 
};

export async function addPage(options: AddPageOptions = {}) {
  const pageName =
    options.pageName ??
    (await input({
      message: 'Enter page name (PascalCase):',
      validate: (value) =>
        isPascalCase(value) || 'Page name must be PascalCase',
    }));

  const routePath =
    options.routePath ??
    (await input({
      message: 'Enter route path (must start with /):',
      validate: (value) =>
        value.startsWith('/') || 'Path must start with "/"',
    }));

  const addToNavbar =
    options.addToNavbar ??
    (await confirm({
      message: 'Add this page to the navbar?',
      default: true,
    }));

  const camelName = toCamelCase(pageName);
  const pageFolder = path.join(pagesDir, camelName);
  const pageFile = path.join(pageFolder, `${pageName}.tsx`);

  if (fs.existsSync(pageFolder)) {
    throw new Error(`Page "${pageName}" already exists`);
  }

  fs.mkdirSync(pageFolder, { recursive: true });
  const templateFn = options.template ?? templates.default;
  fs.writeFileSync(pageFile, templateFn(pageName));

  await updateAppRoutes({
    pageName,
    camelName,
    routePath,
  });

  if (addToNavbar) {
    await updateNavbar(pageName, routePath);
  }

  console.log(`Page "${pageName}" created at ${routePath}`);
}

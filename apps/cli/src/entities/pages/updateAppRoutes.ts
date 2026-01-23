import fs from 'node:fs';
import prettier from 'prettier';
import { appFile } from '../../shared/paths.js';

type RouteConfig = {
  pageName: string;
  camelName: string;
  routePath: string;
};

export async function updateAppRoutes({
  pageName,
  camelName,
  routePath,
}: RouteConfig) {
  let content = fs.readFileSync(appFile, 'utf-8');

  const importStatement = `import ${pageName} from './pages/${camelName}/${pageName}';`;

  if (!content.includes(importStatement)) {
    const importRegex = /^(import .*;)\s*$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];

      content = content.replace(
        lastImport,
        `${lastImport}\n${importStatement}`
      );
    }
  }

  const routeStatement = `<Route path="${routePath}" element={<${pageName} />} />`;

  if (!content.includes(routeStatement)) {
    content = content.replace(
      /\{\/\* new routes inserted here \*\/\}/,
      `{/* new routes inserted here */}
          ${routeStatement}`
    );
  }

  const formatted = await prettier.format(content, {
    parser: 'typescript',
  });

  fs.writeFileSync(appFile, formatted);
}

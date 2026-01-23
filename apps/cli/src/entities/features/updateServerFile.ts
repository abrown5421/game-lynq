import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';

export async function updateServerFile(camelName: string, pluralCamelName: string, apiRoot: string) {
  const serverFile = path.join(apiRoot, 'server.ts');
  
  if (!fs.existsSync(serverFile)) {
    throw new Error(`server.ts not found at ${serverFile}`);
  }

  let content = fs.readFileSync(serverFile, 'utf-8');

  const importStatement = `import ${camelName}Routes from './routes/${pluralCamelName}.routes';`;
  
  if (!content.includes(importStatement)) {
    const importRegex = /import\s+\w+Routes\s+from\s+['"]\.\/routes\/\w+\.routes['"]/g;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      content = content.replace(
        lastImport,
        `${lastImport}\n${importStatement}`
      );
    } else {
      const allImports = /^import .*;$/gm;
      const matches = content.match(allImports);
      if (matches && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        content = content.replace(
          lastMatch,
          `${lastMatch}\n${importStatement}`
        );
      }
    }
  }

  const routeUsage = `app.use('/api/${pluralCamelName}', ${camelName}Routes);`;
  
  if (!content.includes(routeUsage)) {
    const routeRegex = /app\.use\(['"]\/api\/\w+['"],\s*\w+Routes\);/g;
    const routes = content.match(routeRegex);
    
    if (routes && routes.length > 0) {
      const lastRoute = routes[routes.length - 1];
      content = content.replace(
        lastRoute,
        `${lastRoute}\n${routeUsage}`
      );
    } else {
      const integrationsLine = "app.use('/api/integrations', integrationsRoutes);";
      if (content.includes(integrationsLine)) {
        content = content.replace(
          integrationsLine,
          `${routeUsage}\n\n${integrationsLine}`
        );
      }
    }
  }

  const formatted = await prettier.format(content, {
    parser: 'typescript',
  });

  fs.writeFileSync(serverFile, formatted);
}

export async function removeFromServerFile(camelName: string, pluralCamelName: string, apiRoot: string) {
  const serverFile = path.join(apiRoot, 'server.ts');
  
  if (!fs.existsSync(serverFile)) {
    throw new Error(`server.ts not found at ${serverFile}`);
  }

  let content = fs.readFileSync(serverFile, 'utf-8');

  const importPattern = new RegExp(
    `import ${camelName}Routes from ['"]\\.\\/routes\\/${pluralCamelName}\\.routes['"];?\\s*`,
    'g'
  );
  
  if (importPattern.test(content)) {
    content = content.replace(importPattern, '');
  }

  const routePattern = new RegExp(
    `app\\.use\\(['"]\\/api\\/${pluralCamelName}['"],\\s*${camelName}Routes\\);\\s*`,
    'g'
  );
  
  if (routePattern.test(content)) {
    content = content.replace(routePattern, '');
  }

  content = content.replace(/\n\n\n+/g, '\n\n');

  const formatted = await prettier.format(content, {
    parser: 'typescript',
  });

  fs.writeFileSync(serverFile, formatted);
}


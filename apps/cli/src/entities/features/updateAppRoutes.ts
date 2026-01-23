import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";

export async function updateAppRoutes(featureName: string, webSrc: string) {
  const appFile = path.join(webSrc, "App.tsx");

  if (!fs.existsSync(appFile)) {
    throw new Error(`App.tsx not found at ${appFile}`);
  }

  let content = fs.readFileSync(appFile, "utf-8");

  const camelName = featureName.charAt(0).toLowerCase() + featureName.slice(1);
  const capitalizedName = featureName;

  const importStatement = `import Admin${capitalizedName} from "./pages/admin${capitalizedName}/Admin${capitalizedName}";`;

  if (!content.includes(importStatement)) {
    const adminImportRegex = /import Admin\w+ from ["']\.\/pages\/admin\w+\/Admin\w+["'];/g;
    const adminImports = content.match(adminImportRegex);

    if (adminImports && adminImports.length > 0) {
      const lastAdminImport = adminImports[adminImports.length - 1];
      content = content.replace(
        lastAdminImport,
        `${lastAdminImport}\n${importStatement}`
      );
    } else {
      const adminUserImport = /import AdminUser from ["']\.\/pages\/adminUser\/AdminUser["'];/;
      if (adminUserImport.test(content)) {
        content = content.replace(
          adminUserImport,
          (match) => `${match}\n${importStatement}`
        );
      }
    }
  }

  const routes = `              <Route path="/admin-${camelName}" element={<Admin${capitalizedName} />} />
              <Route path="/admin-${camelName}/:id" element={<Admin${capitalizedName} />} />
              <Route path="/admin-${camelName}/new" element={<Admin${capitalizedName} />} />`;
  const routePath = `/admin-${camelName}`;

  if (!content.includes(routePath)) {
    const markerRegex = /\{\/\* new routes inserted here \*\/\}/;

    if (markerRegex.test(content)) {
        content = content.replace(
        markerRegex,
        `{/* new routes inserted here */}
            ${routes}`
        );
    } else {
        const dashboardRouteRegex = /<Route\s+path="\/admin-dashboard"/;

        if (dashboardRouteRegex.test(content)) {
        content = content.replace(
            dashboardRouteRegex,
            `${routes}
                $&`
        );
        }
    }
  }


  const formatted = await prettier.format(content, {
    parser: "typescript",
  });

  fs.writeFileSync(appFile, formatted);
  console.log(`Added routes for Admin${capitalizedName} to App.tsx`);
}

export async function removeAppRoutes(featureName: string, webSrc: string) {
  const appFile = path.join(webSrc, "App.tsx");

  if (!fs.existsSync(appFile)) {
    throw new Error(`App.tsx not found at ${appFile}`);
  }

  let content = fs.readFileSync(appFile, "utf-8");

  const camelName = featureName.charAt(0).toLowerCase() + featureName.slice(1);
  const capitalizedName = featureName;

  const importPattern = new RegExp(
    `import Admin${capitalizedName} from ["']\\.\\/pages\\/admin${capitalizedName}\\/Admin${capitalizedName}["'];?\\s*`,
    "g"
  );

  if (importPattern.test(content)) {
    content = content.replace(importPattern, "");
  }

  const routePattern = new RegExp(
    `<Route path="\\/admin-${camelName}(?:\\/:\\w+|\\/:id|\\/:id\\/edit|\\/new)?" element={<Admin${capitalizedName}[^>]*>} />\\s*`,
    "g"
  );

  if (routePattern.test(content)) {
    content = content.replace(routePattern, "");
  }

  content = content.replace(/\n\n\n+/g, "\n\n");

  const formatted = await prettier.format(content, {
    parser: "typescript",
  });

  fs.writeFileSync(appFile, formatted);
  console.log(`Removed routes for Admin${capitalizedName} from App.tsx`);
}
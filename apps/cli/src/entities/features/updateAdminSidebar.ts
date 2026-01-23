import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";

const DEFAULT_ICON = "CubeIcon";

export async function updateAdminSidebar(
  featureName: string,
  webSrc: string
) {
  const sidebarFile = path.join(
    webSrc,
    "features",
    "adminSidebar",
    "AdminSidebar.tsx"
  );

  if (!fs.existsSync(sidebarFile)) {
    throw new Error(`AdminSidebar.tsx not found at ${sidebarFile}`);
  }

  let content = fs.readFileSync(sidebarFile, "utf-8");

  const camelName =
    featureName.charAt(0).toLowerCase() + featureName.slice(1);
  const pluralName = `${featureName}s`;

  if (content.includes(`/admin-${camelName}`)) {
    console.log(`ℹ️  Sidebar link for ${featureName} already exists`);
    return;
  }
  
  const iconImportRegex =
    /import\s*{\s*([^}]+)\s*}\s*from\s*["@']@heroicons\/react\/24\/outline["@'];/;

  const iconImportMatch = content.match(iconImportRegex);

  if (iconImportMatch) {
    const existingIcons = iconImportMatch[1]
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    if (!existingIcons.includes(DEFAULT_ICON)) {
      existingIcons.push(DEFAULT_ICON);

      content = content.replace(
        iconImportRegex,
        `import { ${existingIcons.join(
          ", "
        )} } from "@heroicons/react/24/outline";`
      );
    }
  }
  
  const newLink = `    {
      title: "${pluralName}",
      url: "/admin-${camelName}",
      icon: <${DEFAULT_ICON} className="w-6 h-6 mr-3" />,
    },`;

  const newLinksMarker = /\/\/ new links here/;
  const linksArrayRegex = /const links = \[([\s\S]*?)\];/;

  if (newLinksMarker.test(content)) {
    content = content.replace(
      newLinksMarker,
      `${newLink}\n    // new links here`
    );
  } else {
    const linksMatch = content.match(linksArrayRegex);

    if (linksMatch) {
      const linksContent = linksMatch[1].trimEnd();
      content = content.replace(
        linksArrayRegex,
        `const links = [\n${linksContent}\n${newLink}\n];`
      );
    }
  }

  const formatted = await prettier.format(content, {
    parser: "typescript",
  });

  fs.writeFileSync(sidebarFile, formatted);
  console.log(` Added ${pluralName} link to AdminSidebar.tsx`);
}

export async function removeAdminSidebarLink(
  featureName: string,
  webSrc: string
) {
  const sidebarFile = path.join(
    webSrc,
    "features",
    "adminSidebar",
    "AdminSidebar.tsx"
  );

  if (!fs.existsSync(sidebarFile)) {
    throw new Error(`AdminSidebar.tsx not found at ${sidebarFile}`);
  }

  let content = fs.readFileSync(sidebarFile, "utf-8");

  const camelName = featureName.charAt(0).toLowerCase() + featureName.slice(1);
  const pluralName = `${featureName}s`;

  const linkPattern = new RegExp(
    `\\s*\\{\\s*title:\\s*["']${pluralName}["'],\\s*url:\\s*["']/admin-${camelName}["'],\\s*icon:\\s*<[^>]+>,?\\s*\\},?\\s*\n?`,
    'g'
  );

  if (!linkPattern.test(content)) {
    console.log(`ℹ️  No sidebar link found for ${featureName}`);
    return;
  }

  content = content.replace(linkPattern, '');
  content = content.replace(/,(\s*),/g, ',');
  content = content.replace(/,(\s*)\]/g, '$1]');
  
  content = content.replace(/\n\n\n+/g, '\n\n');

  const formatted = await prettier.format(content, {
    parser: "typescript",
  });

  fs.writeFileSync(sidebarFile, formatted);
  console.log(` Removed ${featureName} link from AdminSidebar.tsx`);
}

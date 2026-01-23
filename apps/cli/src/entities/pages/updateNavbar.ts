import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import { webSrc } from '../../shared/paths.js';

const navbarFile = path.join(webSrc, 'features/navbar/Navbar.tsx');
const drawerFile = path.join(webSrc, 'features/navbar/NavbarDrawer.tsx');

export async function updateNavbar(
  pageName: string,
  routePath: string,
  drawerOnly = false
) {
  const humanReadableName = pageName.replace(/([a-z\d])([A-Z])/g, '$1 $2');

  const linkString = `<Link className={classString("${routePath}")} to="${routePath}">${humanReadableName}</Link>`;
  const drawerLinkString = `<Link onClick={closeOnClick} className={classString('${routePath}')} to="${routePath}">${humanReadableName}</Link>`;

  if (!drawerOnly) {
    let navContent = fs.readFileSync(navbarFile, 'utf-8');

    if (!navContent.includes(linkString)) {
      navContent = navContent.replace(
        /\{\s*\/\*\s*new links inserted here\s*\*\/\s*\}/,
        `{/* new links inserted here */}\n        ${linkString}`
      );

      const formatted = await prettier.format(navContent, {
        parser: 'typescript',
      });

      fs.writeFileSync(navbarFile, formatted);
    }
  }

  let drawerContent = fs.readFileSync(drawerFile, 'utf-8');

  if (!drawerContent.includes(drawerLinkString)) {
    drawerContent = drawerContent.replace(
      /\{\s*\/\*\s*new links inserted here\s*\*\/\s*\}/,
      `{/* new links inserted here */}\n      ${drawerLinkString}`
    );

    const formattedDrawer = await prettier.format(drawerContent, {
      parser: 'typescript',
    });

    fs.writeFileSync(drawerFile, formattedDrawer);
  }
}

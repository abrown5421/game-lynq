import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, '../../../../');

export const webSrc = path.join(repoRoot, 'apps/web/src');
export const pagesDir = path.join(webSrc, 'pages');
export const appFile = path.join(webSrc, 'App.tsx');

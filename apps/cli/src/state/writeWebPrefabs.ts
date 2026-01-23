import fs from "node:fs";
import path from "node:path";
import { loadPrefabState } from "../state/prefabRegistry.js";

const WEB_PREFABS_PATH = path.resolve(
  process.cwd(),
  "../web/src/config/prefabs.ts"
);

export function writeWebPrefabs() {
  const state = loadPrefabState();

  const content = `
// ⚠️ AUTO-GENERATED — DO NOT EDIT
export const PREFABS = ${JSON.stringify(state, null, 2)} as const;

export type PrefabKey = keyof typeof PREFABS;
`;

  fs.mkdirSync(path.dirname(WEB_PREFABS_PATH), { recursive: true });
  fs.writeFileSync(WEB_PREFABS_PATH, content, "utf-8");
}

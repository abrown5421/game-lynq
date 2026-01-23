import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeWebPrefabs } from "./writeWebPrefabs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.resolve(
  __dirname,
  "prefabs.json"
);

type PrefabState = Record<string, boolean>;

export function loadPrefabState(): PrefabState {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return {};
  }

  const raw = fs.readFileSync(REGISTRY_PATH, "utf-8").trim();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn(
      `[WARN] Failed to parse prefabs.json. Resetting.`,
      err
    );
    return {};
  }
}

export function savePrefabState(state: PrefabState) {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(
    REGISTRY_PATH,
    JSON.stringify(state, null, 2),
    "utf-8"
  );
}

export function setPrefabEnabled(name: string, enabled: boolean) {
  const state = loadPrefabState();
  state[name] = enabled;
  savePrefabState(state);

  writeWebPrefabs();
}

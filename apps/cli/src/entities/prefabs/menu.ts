import { showMenu } from "../../shared/menu.js";
import { prefabs } from "./registry.js";

export async function prefabsMenu() {
  let back = false;

  while (!back) {
    const entries = Object.entries(prefabs).map(([key, prefab]) => ({
      label: `${prefab.label} ${prefab.enabled ? "[ON]" : "[OFF]"}`,
      value: key,
    }));

    const action = await showMenu("Prefabs (toggle to enable/disable):", [
      ...entries,
      { label: "Back to Main Menu", value: "back" },
    ]);

    if (action === "back") {
      back = true;
      continue;
    }

    const prefab = prefabs[action as keyof typeof prefabs];

    if (prefab.enabled) {
      console.log(`Disabling ${prefab.label}...`);
      await prefab.disable();
    } else {
      console.log(`Enabling ${prefab.label}...`);
      await prefab.enable();
    }
  }
}


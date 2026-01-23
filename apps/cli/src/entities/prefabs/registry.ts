import fs from "node:fs";
import { loadPrefabState, setPrefabEnabled } from "../../state/prefabRegistry.js";

export function fileExists(path: string): boolean {
  return fs.existsSync(path);
}

export type Prefab = {
  label: string;
  enabled: boolean; 
  enable: () => Promise<void>;
  disable: () => Promise<void>;
};

const persisted = loadPrefabState();

export const prefabs = {
  blog: {
    label: "Blog",
    enabled: persisted.blog ?? false,
    enable: async () => {
      const { enableBlog } = await import("./blog/enableBlog.js");
      await enableBlog();
      prefabs.blog.enabled = true;
      setPrefabEnabled("blog", true);
    },
    disable: async () => {
      const { disableBlog } = await import("./blog/disableBlog.js");
      await disableBlog();
      prefabs.blog.enabled = false;
      setPrefabEnabled("blog", false);
    },
  },

  contact: {
    label: "Contact",
    enabled: persisted.contact ?? false,
    enable: async () => {
      const { enableContact } = await import("./contact/enableContact.js");
      await enableContact();
      prefabs.contact.enabled = true;
      setPrefabEnabled("contact", true);
    },
    disable: async () => {
      const { disableContact } = await import("./contact/disableContact.js");
      await disableContact();
      prefabs.contact.enabled = false;
      setPrefabEnabled("contact", false);
    },
  },

   ecommerce: {
    label: "Ecommerce",
    enabled: persisted.ecommerce ?? false,
    enable: async () => {
      const { enableEcommerce } = await import("./ecommerce/enableEcommerce.js");
      await enableEcommerce();
      prefabs.ecommerce.enabled = true;
      setPrefabEnabled("ecommerce", true);
    },
    disable: async () => {
      const { disableEcommerce } = await import("./ecommerce/disableEcommerce.js");
      await disableEcommerce();
      prefabs.ecommerce.enabled = false;
      setPrefabEnabled("ecommerce", false);
    },
  },

  staff: {
    label: "Staff",
    enabled: persisted.staff ?? false,
    enable: async () => {
      const { enableStaff } = await import("./staff/enableStaff.js");
      await enableStaff();
      prefabs.staff.enabled = true;
      setPrefabEnabled("staff", true);
    },
    disable: async () => {
      const { disableStaff } = await import("./staff/disableStaff.js");
      await disableStaff();
      prefabs.staff.enabled = false;
      setPrefabEnabled("staff", false);
    },
  },
};

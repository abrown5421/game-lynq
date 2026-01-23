import { deletePage } from "../../pages/deletePage.js";

export async function disableStaff() {
  await deletePage({ pageName: "Staff" });
}

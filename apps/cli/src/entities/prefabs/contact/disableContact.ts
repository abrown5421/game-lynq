import { deletePage } from "../../pages/deletePage.js";

export async function disableContact() {
  await deletePage({ pageName: "Contact" });
}

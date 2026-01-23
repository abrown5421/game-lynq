import { deleteFeature } from "../../features/deleteFeature.js";
import { deletePage } from "../../pages/deletePage.js";

export async function disableBlog() {
  await deletePage({ pageName: "BlogPost" });
  await deletePage({ pageName: "Blog" });
  await deleteFeature({ featureName: "BlogPost" });
}

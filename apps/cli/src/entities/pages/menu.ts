import { showMenu } from "../../shared/menu.js";
import { addPage } from "./addPage.js";
import { deletePage } from "./deletePage.js";

export async function pagesMenu() {
  let back = false;

  while (!back) {
    const action = await showMenu('Pages: What would you like to do?', [
      { label: 'Add page', value: 'add' },
      { label: 'Delete page', value: 'delete' },
      { label: 'Back to Main Menu', value: 'back' }, 
    ]);

    switch (action) {
      case 'add':
        await addPage();
        break;
      case 'delete':
        await deletePage();
        break;
      case 'back':
        back = true;
        break;
      default:
        console.log(`Pages → ${action} (not implemented yet)`);
    }
  }
}

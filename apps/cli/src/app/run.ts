import { featuresMenu } from "../entities/features/menu.js";
import { pagesMenu } from "../entities/pages/menu.js";
import { prefabsMenu } from "../entities/prefabs/menu.js";
import { showMenu } from "../shared/menu.js";

export async function run() {
  let exit = false;

  while (!exit) {
    const domain = await showMenu('What would you like to manage?', [
      { label: 'Pages', value: 'pages' },
      { label: 'Features', value: 'features' },
      { label: 'Prefabs', value: 'prefabs' },
      { label: 'Exit CLI', value: 'exit' }, 
    ]);

    switch (domain) {
      case 'pages':
        await pagesMenu();
        break;
      case 'features':
        await featuresMenu();
        break;
      case 'prefabs':
        await prefabsMenu();
        break;
      case 'exit':
        exit = true;
        console.log('Goodbye!');
        break;
      default:
        console.log('Not implemented yet.');
    }
  }
}

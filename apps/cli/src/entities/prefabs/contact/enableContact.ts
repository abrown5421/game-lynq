import { addPage } from "../../pages/addPage.js";
import { contactTemplate } from "../../pages/templates/contactTemplate.js";

export async function enableContact() {
    await addPage({
        pageName: 'Contact',
        routePath: '/contact',
        addToNavbar: true,
        template: contactTemplate
    });
}
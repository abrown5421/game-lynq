import { addPage } from "../../pages/addPage.js";
import { staffTemplate } from "../../pages/templates/staffPageTemplate.js";

export async function enableStaff() {
    await addPage({
        pageName: 'Staff',
        routePath: '/staff',
        addToNavbar: true,
        template: staffTemplate
    });
}
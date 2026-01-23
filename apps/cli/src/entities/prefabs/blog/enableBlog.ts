import { addFeature } from "../../features/addFeature.js";
import { addPage } from "../../pages/addPage.js";
import { blogPostTemplate } from "../../pages/templates/blogPostTemplate.js";
import { blogTemplate } from "../../pages/templates/blogTemplate.js";

export async function enableBlog() {
    await addPage({
        pageName: 'Blog',
        routePath: '/blog',
        addToNavbar: true,
        template: blogTemplate
    });

    await addPage({
        pageName: 'BlogPost',
        routePath: '/blog/:id',
        addToNavbar: false,
        template: blogPostTemplate
    });

    await addFeature({
        featureName: "BlogPost",
        addTimestamps: true,
        addToCms: true,
        schema: {
            name: "BlogPost",
            fields: [
                { name: "post_title", type: "String", required: true },
                { name: "post_body", type: "String", required: true },
                { name: "post_author", type: "String", required: true },
                { name: "post_category", type: "String", required: true },
                { name: "post_image", type: "String", required: false },
            ],
        },
    });
}
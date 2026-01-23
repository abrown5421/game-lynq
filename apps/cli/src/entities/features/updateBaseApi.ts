import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';

export async function updateBaseApi(featureName: string, webSrc: string) {
  const baseApiFile = path.join(webSrc, 'app', 'store', 'api', 'baseApi.ts');
  
  if (!fs.existsSync(baseApiFile)) {
    throw new Error(`baseApi.ts not found at ${baseApiFile}`);
  }

  let content = fs.readFileSync(baseApiFile, 'utf-8');

  if (content.includes(`'${featureName}'`)) {
    console.log(` Tag type '${featureName}' already exists in baseApi.ts`);
    return;
  }

  const tagTypesRegex = /tagTypes:\s*\[([\s\S]*?)\]/;
  const match = content.match(tagTypesRegex);

  if (!match) {
    throw new Error('Could not find tagTypes array in baseApi.ts');
  }

  const existingTags = match[1];
  
  const hasExistingTags = existingTags.trim().length > 0;
  
  let newTagsContent;
  if (hasExistingTags) {
    newTagsContent = `tagTypes: [${existingTags}, '${featureName}']`;
  } else {
    newTagsContent = `tagTypes: ['${featureName}']`;
  }

  content = content.replace(tagTypesRegex, newTagsContent);

  const formatted = await prettier.format(content, {
    parser: 'typescript',
  });

  fs.writeFileSync(baseApiFile, formatted);
  console.log(` Added '${featureName}' to tagTypes in baseApi.ts`);
}

export async function removeFromBaseApi(featureName: string, webSrc: string) {
  const baseApiFile = path.join(webSrc, 'app', 'store', 'api', 'baseApi.ts');
  
  if (!fs.existsSync(baseApiFile)) {
    throw new Error(`baseApi.ts not found at ${baseApiFile}`);
  }

  let content = fs.readFileSync(baseApiFile, 'utf-8');

  const tagTypesRegex = /tagTypes:\s*\[([\s\S]*?)\]/;
  const match = content.match(tagTypesRegex);

  if (!match) {
    throw new Error('Could not find tagTypes array in baseApi.ts');
  }

  const existingTags = match[1];
  
  const tagPattern = new RegExp(`['"]${featureName}['"],?\\s*`, 'g');
  const newTagsContent = existingTags.replace(tagPattern, '');
  
  const cleanedTags = newTagsContent.replace(/,(\s*)\]/g, '$1]').replace(/,(\s*),/g, ',');
  
  content = content.replace(tagTypesRegex, `tagTypes: [${cleanedTags}]`);

  const formatted = await prettier.format(content, {
    parser: 'typescript',
  });

  fs.writeFileSync(baseApiFile, formatted);
}

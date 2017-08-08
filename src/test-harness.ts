import * as path from 'path';

import { DocFXProject } from './docfx-project';

const baseDir = path.resolve('.');
console.log(`BaseDir = "${baseDir}"`);

getFilesTest().catch(
    error => console.log(error)
);

async function getFilesTest(): Promise<void> {
    // const include = '**/*.ts';
    // const excludes = [ '.git/**' , 'node_modules/**', '**/*.d.ts' ];
    
    // const files: string[] = await findFiles(baseDir, include, ...excludes);

    const project = await DocFXProject.load('D:\\Development\\gitlab\\service-layer\\documentation\\docs\\docfx.json');
    const contentFiles = await project.getContentFiles('.md');

    console.log('Files:');
    console.log(contentFiles);
}

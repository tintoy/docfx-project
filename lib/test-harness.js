"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const docfx_project_1 = require("./docfx-project");
const baseDir = path.resolve('.');
console.log(`BaseDir = "${baseDir}"`);
getFilesTest().catch(error => console.log(error));
function getFilesTest() {
    return __awaiter(this, void 0, void 0, function* () {
        // const include = '**/*.ts';
        // const excludes = [ '.git/**' , 'node_modules/**', '**/*.d.ts' ];
        // const files: string[] = await findFiles(baseDir, include, ...excludes);
        const project = yield docfx_project_1.DocFXProject.load('D:\\Development\\gitlab\\service-layer\\documentation\\docs\\docfx.json');
        const contentFiles = yield project.getContentFiles('.md');
        console.log('Files:');
        console.log(contentFiles);
    });
}
//# sourceMappingURL=test-harness.js.map
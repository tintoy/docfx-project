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
const file_filter_1 = require("./utils/file-filter");
const fs_1 = require("./utils/fs");
const path = require("path");
const baseDir = path.resolve('.');
console.log(`BaseDir = "${baseDir}"`);
const filter = new file_filter_1.FileFilter(baseDir, ['**/*.d.ts'], ['.git/**', 'node_modules/**']);
getFilesTest().catch(error => console.log(error));
function getFilesTest() {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield fs_1.getFilesRecursive(baseDir, filter);
        console.log('Files:');
        console.log(files);
    });
}
//# sourceMappingURL=test-harness.js.map
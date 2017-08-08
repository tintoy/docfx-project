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
const file_filter_1 = require("./utils/file-filter");
const fs_1 = require("./utils/fs");
/**
 * Represents a DocFX project and its files.
 */
class DocFXProject {
    /**
     * Create a new {@link DocFXProject}.
     *
     * @param projectFile The full path to the project file (`docfx.json`).
     * @param projectData The DocFX project data.
     */
    constructor(projectFile, projectData) {
        this.projectFile = projectFile;
        this.projectDir = path.dirname(projectFile);
        this._contentFileFilter = createFileFilter(this.projectDir, projectData.build.content);
    }
    /**
     * Determine whether the specified content file is included in the project.
     *
     * @param filePath The full or relative path of the file.
     *
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    includesContentFile(filePath) {
        return this._contentFileFilter.shouldIncludeFile(filePath);
    }
    /**
     * Retrieve the paths of all content files in the project.
     *
     * @param extensions {string[]} Optional file extensions used to filter the results.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getContentFiles(...extensions) {
        return __awaiter(this, void 0, void 0, function* () {
            // This is cheating somewhat; there's no guarantee that the final base directory for a file group lies within the project directory.
            // TODO: Capture file groups in constructor and walk each file group separately.
            let contentFiles = yield fs_1.getFilesRecursive(this.projectDir);
            contentFiles = contentFiles.filter(this.includesContentFile);
            if (extensions.length) {
                const filterExtensions = new Set(extensions.map(extension => extension.toLowerCase()));
                contentFiles = contentFiles.filter(contentFile => filterExtensions.has(path.extname(contentFile)));
            }
            return contentFiles;
        });
    }
    /**
     * Load and parse the specified DocFX project file.
     *
     * @param projectFile The full path to the project file.
     *
     * @returns {Promise<DocFXProject>} A promise that resolves to the {@link DocFXProject}.
     */
    static load(projectFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const projectData = yield fs_1.readJson(projectFile);
            return new DocFXProject(projectFile, projectData);
        });
    }
}
exports.DocFXProject = DocFXProject;
/**
 * Create a new FileFilter based on the specified file groups.
 *
 * @param baseDir The base directory (file groups are considered relative to this directory).
 * @param fileGroups One or more file groups from the DocFX project.
 */
function createFileFilter(baseDir, fileGroups) {
    const includePatterns = [];
    const excludePatterns = [];
    for (const fileGroup of fileGroups) {
        if (!fileGroup.files)
            continue;
        const entryBaseDirectory = path.join(baseDir, fileGroup.src || '');
        const entryIncludePatterns = fileGroup.files.filter((pattern) => !pattern.endsWith('.json') // Ignore Swagger files
        );
        if (!entryIncludePatterns.length)
            continue;
        const entryExcludePatterns = (fileGroup.exclude || []).filter((pattern) => !pattern.endsWith('.json') // Ignore Swagger files
        );
        includePatterns.push(...entryIncludePatterns);
        excludePatterns.push(...entryExcludePatterns);
    }
    return new file_filter_1.FileFilter(baseDir, includePatterns, excludePatterns);
}
//# sourceMappingURL=docfx-project.js.map
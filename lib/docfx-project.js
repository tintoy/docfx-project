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
const topic_metadata_1 = require("./topic-metadata");
const file_filter_1 = require("./utils/file-filter");
const fs_1 = require("./utils/fs");
/** DocFX supports this '**' glob syntax, but we don't. */
const illegalGlobStar = '**.';
/** We support this '**' glob syntax. */
const legalGlobStar = '**/*.';
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
        /** FileGroups representing the project's content files. */
        this._fileGroups = [];
        this.projectFile = projectFile;
        this.projectDir = path.dirname(projectFile);
        if (projectData.build && projectData.build.content) {
            projectData.build.content.forEach(fileGroupData => {
                this._fileGroups.push(new FileGroup(this.projectDir, fileGroupData));
            });
        }
        // Preserve this.
        this.includesContentFile = this.includesContentFile.bind(this);
        this.getContentFiles = this.getContentFiles.bind(this);
        this.getTopics = this.getTopics.bind(this);
    }
    /**
     * Determine whether the specified content file is included in the project.
     *
     * @param filePath The full or relative path of the file.
     *
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    includesContentFile(filePath) {
        for (const fileGroup of this._fileGroups) {
            if (fileGroup.includesFile(filePath))
                return true;
        }
        return false;
    }
    /**
     * Retrieve the metadata for all topics in the project.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getTopics(progress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (progress)
                progress.next('Scanning for content files...');
            const contentFiles = yield this.getContentFiles('.md', '.yml');
            const totalFileCount = contentFiles.length;
            let topicCount = 0;
            let processedFileCount = 0;
            function reportFileProcessed(fileTopicCount) {
                topicCount += fileTopicCount;
                processedFileCount++;
                if (!progress)
                    return;
                const percentComplete = Math.ceil((processedFileCount / totalFileCount) * 100);
                if (progress)
                    progress.next(`Discovered ${topicCount} topics (${percentComplete}% complete)...`);
            }
            const topicMetadata = [];
            for (const contentFile of contentFiles) {
                const contentFileTopics = yield topic_metadata_1.getFileTopics(contentFile);
                topicMetadata.push(...contentFileTopics);
                reportFileProcessed(contentFileTopics.length);
            }
            progress.next('Scan complete.');
            return topicMetadata;
        });
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
            let allContentFiles = new Set();
            for (const fileGroup of this._fileGroups) {
                const groupFiles = yield fileGroup.getFiles(...extensions);
                groupFiles.forEach(groupFile => allContentFiles.add(groupFile));
            }
            let contentFiles = Array.from(allContentFiles.values());
            if (extensions.length) {
                const filterExtensions = new Set(extensions.map(extension => extension.toLowerCase()));
                contentFiles = contentFiles.filter(contentFile => filterExtensions.has(path.extname(contentFile).toLowerCase()));
            }
            contentFiles.sort();
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
/** Represents a group of files in a DocFX project. */
class FileGroup {
    /** Create a new {@link FileGroup}. */
    constructor(projectBaseDir, data) {
        this.projectBaseDir = projectBaseDir;
        this.relativeBaseDir = data.src || '';
        this.baseDir = path.join(this.projectBaseDir, this.relativeBaseDir);
        const includePatterns = data.files ? data.files.slice() : [];
        const excludePatterns = data.exclude ? data.exclude.slice() : [];
        this.fileFilter = new file_filter_1.FileFilter(this.baseDir, includePatterns, excludePatterns);
    }
    /**
     * Determine whether the specified file is included in the group.
     *
     * @param filePath The full or relative path of the file.
     *
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    includesFile(filePath) {
        return this.fileFilter.shouldIncludeFile(filePath);
    }
    /**
     * Retrieve the paths of all files in the group.
     *
     * @param extensions {string[]} Optional file extensions used to filter the results.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getFiles(...extensions) {
        return __awaiter(this, void 0, void 0, function* () {
            let allFiles = new Set();
            const includePatterns = this.fileFilter.includePatterns;
            const excludePatterns = this.fileFilter.excludePatterns;
            for (const includePattern of includePatterns) {
                const includeFiles = yield fs_1.findFiles(this.baseDir, includePattern, ...excludePatterns);
                includeFiles.forEach(includeFile => allFiles.add(includeFile));
            }
            let contentFiles = Array.from(allFiles.values());
            contentFiles = contentFiles.filter(this.fileFilter.shouldIncludeFile);
            if (extensions.length) {
                const filterExtensions = new Set(extensions.map(extension => extension.toLowerCase()));
                contentFiles = contentFiles.filter(contentFile => filterExtensions.has(path.extname(contentFile)));
            }
            contentFiles.sort();
            return contentFiles;
        });
    }
}
exports.FileGroup = FileGroup;
//# sourceMappingURL=docfx-project.js.map
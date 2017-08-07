"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("./utils/fs");
/**
 * Matchers for files (include / exclude).
 */
class FileFilter {
    /**
     * Create a new content file matcher.
     *
     * @param baseDir The base directory for comparisons.
     * @param includePatterns Matchers for including content files.
     * @param excludePatterns
     */
    constructor(baseDir, includePatterns, excludePatterns) {
        this.baseDir = baseDir;
        this.includeMatchers = fs_1.createMatchers(...includePatterns);
        this.excludeMatchers = fs_1.createMatchers(...excludePatterns);
    }
    /**
     * Determine whether the specified file should be included.
     *
     * @param filePath The full or relative path of the file.
     */
    shouldIncludeFile(filePath) {
        const relativeFilePath = path.relative(this.baseDir, filePath);
        for (const exclude of this.excludeMatchers) {
            if (exclude.match(relativeFilePath))
                return false;
        }
        for (const include of this.includeMatchers) {
            if (include.match(relativeFilePath)) {
                return true;
            }
        }
        return false;
    }
}
exports.FileFilter = FileFilter;
//# sourceMappingURL=file-filter.js.map
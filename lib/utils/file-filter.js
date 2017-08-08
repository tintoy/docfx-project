"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs_1 = require("./fs");
/**
 * Matchers for files (include / exclude).
 */
class FileFilter {
    /** Patterns for including files. */
    get includePatterns() {
        return this._includePatterns.slice();
    }
    /** Patterns for excluding files. */
    get excludePatterns() {
        return this._excludePatterns.slice();
    }
    /**
     * Create a new content file matcher.
     *
     * @param baseDir The base directory for comparisons.
     * @param includePatterns Matchers for including content files.
     * @param excludePatterns
     */
    constructor(baseDir, includePatterns, excludePatterns) {
        this._baseDir = baseDir;
        this._includePatterns = includePatterns || [];
        this._includeMatchers = fs_1.createMatchers(...this._includePatterns);
        this._excludePatterns = excludePatterns || [];
        this._excludeMatchers = fs_1.createMatchers(...this._excludePatterns);
        // Preserve this.
        this.shouldIncludeFile = this.shouldIncludeFile.bind(this);
    }
    /**
     * Determine whether the specified file should be included.
     *
     * @param filePath The full or relative path of the file.
     */
    shouldIncludeFile(filePath) {
        const relativeFilePath = path.isAbsolute(filePath) ? path.relative(this._baseDir, filePath) : filePath;
        let shouldInclude = false;
        for (const include of this._includeMatchers) {
            shouldInclude = include.match(relativeFilePath);
            if (shouldInclude)
                break;
        }
        if (shouldInclude) {
            for (const exclude of this._excludeMatchers) {
                shouldInclude = !exclude.match(relativeFilePath);
                if (!shouldInclude)
                    return false;
            }
        }
        return shouldInclude;
    }
}
exports.FileFilter = FileFilter;
//# sourceMappingURL=file-filter.js.map
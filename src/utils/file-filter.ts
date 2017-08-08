import { IMinimatch } from 'minimatch';
import * as path from 'path';
import * as glob from 'glob';
import { createMatchers } from './fs';

/**
 * Matchers for files (include / exclude).
 */
export class FileFilter {
    /** Patterns for including files. */
    private _includePatterns: string[];

    /** Matchers for including files. */
    private _includeMatchers: IMinimatch[];

    /** Patterns for excluding files. */
    private _excludePatterns: string[];

    /** Matchers for excluding files. */
    private _excludeMatchers: IMinimatch[];

    /** The base directory for comparisons. */
    private _baseDir: string;

    /** Patterns for including files. */
    public get includePatterns(): string[] {
        return this._includePatterns.slice();
    }

    /** Patterns for excluding files. */
    public get excludePatterns(): string[] {
        return this._excludePatterns.slice();
    }

    /**
     * Create a new content file matcher.
     * 
     * @param baseDir The base directory for comparisons.
     * @param includePatterns Matchers for including content files.
     * @param excludePatterns 
     */
    constructor(baseDir: string, includePatterns: string[], excludePatterns: string[]) {
        this._baseDir = baseDir;

        this._includePatterns = includePatterns || [];
        this._includeMatchers = createMatchers(...this._includePatterns);
        
        this._excludePatterns = excludePatterns || [];
        this._excludeMatchers = createMatchers(...this._excludePatterns);
    }

    /**
     * Determine whether the specified file should be included.
     * 
     * @param filePath The full or relative path of the file.
     */
    public shouldIncludeFile(filePath: string): boolean {
        const relativeFilePath = path.relative(this._baseDir, filePath);

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

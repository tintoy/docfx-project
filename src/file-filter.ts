import { IMinimatch } from 'minimatch';
import * as path from 'path';

import { createMatchers } from './utils/fs';

/**
 * Matchers for files (include / exclude).
 */
export class FileFilter {
    /** Matchers for including content files. */
    private includeMatchers: IMinimatch[];

    /** Matchers for excluding content files. */
    private excludeMatchers: IMinimatch[];

    /** The base directory for comparisons. */
    private baseDir: string;

    /**
     * Create a new content file matcher.
     * 
     * @param baseDir The base directory for comparisons.
     * @param includePatterns Matchers for including content files.
     * @param excludePatterns 
     */
    constructor(baseDir: string, includePatterns: string[], excludePatterns: string[]) {
        this.baseDir = baseDir;
        this.includeMatchers = createMatchers(...includePatterns);
        this.excludeMatchers = createMatchers(...excludePatterns);
    }

    /**
     * Determine whether the specified file should be included.
     * 
     * @param filePath The full or relative path of the file.
     */
    public shouldIncludeFile(filePath: string): boolean {
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

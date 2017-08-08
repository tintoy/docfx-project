/**
 * Matchers for files (include / exclude).
 */
export declare class FileFilter {
    /** Matchers for including content files. */
    private includeMatchers;
    /** Matchers for excluding content files. */
    private excludeMatchers;
    /** The base directory for comparisons. */
    private baseDir;
    /**
     * Create a new content file matcher.
     *
     * @param baseDir The base directory for comparisons.
     * @param includePatterns Matchers for including content files.
     * @param excludePatterns
     */
    constructor(baseDir: string, includePatterns: string[], excludePatterns: string[]);
    /**
     * Determine whether the specified file should be included.
     *
     * @param filePath The full or relative path of the file.
     */
    shouldIncludeFile(filePath: string): boolean;
}

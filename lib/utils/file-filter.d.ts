/**
 * Matchers for files (include / exclude).
 */
export declare class FileFilter {
    /** Patterns for including files. */
    private _includePatterns;
    /** Matchers for including files. */
    private _includeMatchers;
    /** Patterns for excluding files. */
    private _excludePatterns;
    /** Matchers for excluding files. */
    private _excludeMatchers;
    /** The base directory for comparisons. */
    private _baseDir;
    /** Patterns for including files. */
    readonly includePatterns: string[];
    /** Patterns for excluding files. */
    readonly excludePatterns: string[];
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

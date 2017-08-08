/**
 * Represents a DocFX project and its files.
 */
export declare class DocFXProject {
    private _contentFileFilter;
    /** The full path to the project file (`docfx.json`). */
    readonly projectFile: string;
    /** The full path to the project directory. */
    readonly projectDir: string;
    /**
     * Create a new {@link DocFXProject}.
     *
     * @param projectFile The full path to the project file (`docfx.json`).
     * @param projectData The DocFX project data.
     */
    constructor(projectFile: string, projectData: DocFXProjectData);
    /**
     * Determine whether the specified content file is included in the project.
     *
     * @param filePath The full or relative path of the file.
     *
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    includesContentFile(filePath: string): boolean;
    /**
     * Retrieve the paths of all content files in the project.
     *
     * @param extensions {string[]} Optional file extensions used to filter the results.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getContentFiles(...extensions: string[]): Promise<string[]>;
    /**
     * Load and parse the specified DocFX project file.
     *
     * @param projectFile The full path to the project file.
     *
     * @returns {Promise<DocFXProject>} A promise that resolves to the {@link DocFXProject}.
     */
    static load(projectFile: string): Promise<DocFXProject>;
}
/**
 * Represents the root of a DocFX project.
 */
export interface DocFXProjectData {
    /** The project build configuration. */
    build: DocFXBuildConfiguration | null;
}
/**
 * Represents the build configuration for a DocFX project.
 */
export interface DocFXBuildConfiguration {
    /** The project's content file groups. */
    content: FileGroup[] | null;
}
/** Represents the configuration for a group of files in a DocFX project. */
export interface FileGroup {
    /** Relative glob patterns for files to include in the group. */
    files: string[];
    /** Optional relative glob patterns for files to exclude from the group. */
    exclude?: string[];
    /** The source directory used as a base for for the group's glob patterns. */
    src?: string;
    /** An optional relative destination directory for the group's resulting output files. */
    dest?: string;
}

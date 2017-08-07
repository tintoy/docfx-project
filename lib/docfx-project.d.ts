/**
 * Represents a DocFX project and its files.
 */
export declare class DocFXProject {
    private _contentFileFilter;
    readonly projectFile: string;
    readonly projectDir: string;
    constructor(projectFile: string, projectData: DocFXProjectData);
    /**
     * Determine whether the specified conent file is included in the project.
     *
     * @param filePath The full or relative path of the file.
     */
    includesContentFile(filePath: string): boolean;
    /**
     * List all content files in the project.
     */
    getContentFiles(...extensions: string[]): Promise<string[]>;
    /**
     * Load and parse the specified DocFX project file.
     *
     * @param projectFile The full path to the project file.
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

import * as Rx from 'rxjs';
import { TopicMetadata } from './topic-metadata';
import { FileFilter } from './utils/file-filter';
/**
 * Represents a DocFX project and its files.
 */
export declare class DocFXProject {
    /** FileGroups representing the project's content files. */
    private _fileGroups;
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
     * Retrieve the metadata for all topics in the project.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getTopics(progress?: Rx.Observer<string>): Promise<TopicMetadata[]>;
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
/** Represents a group of files in a DocFX project. */
export declare class FileGroup {
    /** The base directory of the project containing the file group. */
    readonly projectBaseDir: string;
    /** The full path of the base directory for the files in the file group. */
    readonly baseDir: string;
    /** The base directory, relative to the project base directory, of the files in the file group. */
    readonly relativeBaseDir: string;
    /** A {@link} FileFilter used to include / exclude files. */
    readonly fileFilter: FileFilter;
    /** Create a new {@link FileGroup}. */
    constructor(projectBaseDir: string, data: FileGroupData);
    /**
     * Determine whether the specified file is included in the group.
     *
     * @param filePath The full or relative path of the file.
     *
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    includesFile(filePath: string): boolean;
    /**
     * Retrieve the paths of all files in the group.
     *
     * @param extensions {string[]} Optional file extensions used to filter the results.
     *
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    getFiles(...extensions: string[]): Promise<string[]>;
}
/**
 * Represents the root of a DocFX project.
 */
export interface DocFXProjectData {
    /** The project build configuration. */
    build: DocFXProjectBuildData | null;
}
/**
 * Represents the build configuration for a DocFX project.
 */
export interface DocFXProjectBuildData {
    /** The project's content file groups. */
    content: FileGroupData[] | null;
}
/** Represents the configuration for a group of files in a DocFX project. */
export interface FileGroupData {
    /** Relative glob patterns for files to include in the group. */
    files: string[];
    /** Optional relative glob patterns for files to exclude from the group. */
    exclude?: string[];
    /** The source directory used as a base for for the group's glob patterns. */
    src?: string;
    /** An optional relative destination directory for the group's resulting output files. */
    dest?: string;
}

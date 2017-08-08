import * as path from 'path';

import { FileFilter } from './utils/file-filter';
import { readJson, findFiles } from './utils/fs';

/** DocFX supports this '**' glob syntax, but we don't. */
const illegalGlobStar = '**.';

/** We support this '**' glob syntax. */
const legalGlobStar = '**/*.';

/**
 * Represents a DocFX project and its files.
 */
export class DocFXProject {
    /** A FileFilter used to filter the project's content files. */
    private _contentFileFilter: FileFilter;
    
    /** The full path to the project file (`docfx.json`). */
    public readonly projectFile: string;

    /** The full path to the project directory. */
    public readonly projectDir: string;

    /**
     * Create a new {@link DocFXProject}.
     * 
     * @param projectFile The full path to the project file (`docfx.json`).
     * @param projectData The DocFX project data.
     */
    constructor(projectFile: string, projectData: DocFXProjectData) {
        this.projectFile = projectFile;
        this.projectDir = path.dirname(projectFile);

        this._contentFileFilter = createFileFilter(this.projectDir, projectData.build.content);

        // Bloody this.
        this.includesContentFile = this.includesContentFile.bind(this);
    }

    /**
     * Determine whether the specified content file is included in the project.
     * 
     * @param filePath The full or relative path of the file.
     * 
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    public includesContentFile(filePath: string): boolean {
        return this._contentFileFilter.shouldIncludeFile(filePath);
    }

    /**
     * Retrieve the paths of all content files in the project.
     * 
     * @param extensions {string[]} Optional file extensions used to filter the results.
     * 
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    public async getContentFiles(...extensions: string[]): Promise<string[]> {
        // This is cheating somewhat; there's no guarantee that the final base directory for a file group lies within the project directory.
        // TODO: Capture file groups in constructor and walk each file group separately.

        let allContentFiles = new Set<string>();
        const includePatterns = this._contentFileFilter.includePatterns;
        const excludePatterns = this._contentFileFilter.excludePatterns;
        for (const includePattern of includePatterns) {
            const includeFiles = await findFiles(this.projectDir, includePattern, ...excludePatterns);
            
            includeFiles.forEach(
                includeFile => allContentFiles.add(includeFile)
            );
        }
        
        let contentFiles: string[] = Array.from(allContentFiles.values());
        contentFiles = contentFiles.filter(this.includesContentFile);

        if (extensions.length) {
            const filterExtensions = new Set<string>(extensions.map(
                extension => extension.toLowerCase()
            ));
            contentFiles = contentFiles.filter(
                contentFile => filterExtensions.has(path.extname(contentFile))
            );
        }

        contentFiles.sort();

        return contentFiles;
    }

    /**
     * Load and parse the specified DocFX project file.
     * 
     * @param projectFile The full path to the project file.
     * 
     * @returns {Promise<DocFXProject>} A promise that resolves to the {@link DocFXProject}.
     */
    public static async load(projectFile: string): Promise<DocFXProject> {
        const projectData = await readJson<DocFXProjectData>(projectFile);

        return new DocFXProject(projectFile, projectData);
    }
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

/**
 * Create a new FileFilter based on the specified file groups.
 * 
 * @param baseDir The base directory (file groups are considered relative to this directory).
 * @param fileGroups One or more file groups from the DocFX project.
 */
function createFileFilter(baseDir: string, fileGroups: FileGroup[]): FileFilter {
    const includePatterns: string[] = [];
    const excludePatterns: string[] = [];
    for (const fileGroup of fileGroups) {
        if (!fileGroup.files)
            continue;

        const entryBaseDirectory = path.join(baseDir, fileGroup.src || '');

        const entryIncludePatterns = fileGroup.files.filter(
            (pattern: string) => !pattern.endsWith('.json') // Ignore Swagger files
        );
        if (!entryIncludePatterns.length)
            continue;

        const entryExcludePatterns = (fileGroup.exclude as string[] || []).filter(
            (pattern: string) => !pattern.endsWith('.json') // Ignore Swagger files
        );

        includePatterns.push(
            ...entryIncludePatterns.map(pattern => pattern.replace(illegalGlobStar, legalGlobStar))
        );
        excludePatterns.push(
            ...entryExcludePatterns.map(pattern => pattern.replace(illegalGlobStar, legalGlobStar))
        );
    }

    return new FileFilter(baseDir, includePatterns, excludePatterns);
}

import * as path from 'path';
import * as Rx from 'rxjs';

import { TopicMetadata, TopicType, getFileTopics } from './topic-metadata';
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
    /** FileGroups representing the project's content files. */
    private _fileGroups: FileGroup[] = [];
    
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
        if (projectData.build && projectData.build.content) {
            projectData.build.content.forEach(fileGroupData => {
                this._fileGroups.push(
                    new FileGroup(this.projectDir, fileGroupData)
                );
            });
        }

        // Preserve this.
        this.includesContentFile = this.includesContentFile.bind(this);
        this.getContentFiles = this.getContentFiles.bind(this);
        this.getTopics = this.getTopics.bind(this);
    }

    /**
     * Determine whether the specified content file is included in the project.
     * 
     * @param filePath The full or relative path of the file.
     * 
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    public includesContentFile(filePath: string): boolean {
        for (const fileGroup of this._fileGroups) {
            if (fileGroup.includesFile(filePath))
                return true;
        }
        
        return false;
    }

    /**
     * Retrieve the metadata for all topics in the project.
     * 
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    public async getTopics(progress?: Rx.Observer<string>): Promise<TopicMetadata[]> {
        if (progress)
            progress.next('Scanning for content files...');

        const contentFiles = await this.getContentFiles('.md', '.yml');

        const totalFileCount: number = contentFiles.length;
        let topicCount = 0;
        let processedFileCount = 0;
        function reportFileProcessed(fileTopicCount: number): void {
            topicCount += fileTopicCount;
            processedFileCount++;

            if (!progress)
                return;

            const percentComplete = Math.ceil(
                (processedFileCount / totalFileCount) * 100
            );

            if (progress)
                progress.next(`Discovered ${topicCount} topics (${percentComplete}% complete)...`);
        }

        const topicMetadata: TopicMetadata[] = [];
        for (const contentFile of contentFiles) {
            const contentFileTopics = await getFileTopics(contentFile);
            topicMetadata.push(...contentFileTopics);
            
            reportFileProcessed(contentFileTopics.length);
        }

        progress.next('Scan complete.');

        return topicMetadata;
    }

    /**
     * Retrieve the paths of all content files in the project.
     * 
     * @param extensions {string[]} Optional file extensions used to filter the results.
     * 
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    public async getContentFiles(...extensions: string[]): Promise<string[]> {
        let allContentFiles = new Set<string>();
        for (const fileGroup of this._fileGroups) {
            const groupFiles = await fileGroup.getFiles(...extensions);
            
            groupFiles.forEach(
                groupFile => allContentFiles.add(groupFile)
            );
        }
        
        let contentFiles: string[] = Array.from(allContentFiles.values());

        if (extensions.length) {
            const filterExtensions = new Set<string>(extensions.map(
                extension => extension.toLowerCase()
            ));
            contentFiles = contentFiles.filter(
                contentFile => filterExtensions.has(
                    path.extname(contentFile).toLowerCase()
                )
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

/** Represents a group of files in a DocFX project. */
export class FileGroup {
    /** The base directory of the project containing the file group. */
    public readonly projectBaseDir: string;

    /** The full path of the base directory for the files in the file group. */
    public readonly baseDir: string;

    /** The base directory, relative to the project base directory, of the files in the file group. */
    public readonly relativeBaseDir: string;

    /** A {@link} FileFilter used to include / exclude files. */
    public readonly fileFilter: FileFilter;

    /** Create a new {@link FileGroup}. */
    constructor(projectBaseDir: string, data: FileGroupData) {
        this.projectBaseDir = projectBaseDir;
        this.relativeBaseDir = data.src || '';
        
        this.baseDir = path.join(this.projectBaseDir, this.relativeBaseDir);

        const includePatterns = data.files ? data.files.slice() : [];
        const excludePatterns = data.exclude ? data.exclude.slice() : [];
        this.fileFilter = new FileFilter(this.baseDir, includePatterns, excludePatterns);
    }

    /**
     * Determine whether the specified file is included in the group.
     * 
     * @param filePath The full or relative path of the file.
     * 
     * @returns {boolean} true, if the file is included in the project; otherwise, false.
     */
    public includesFile(filePath: string): boolean {
        return this.fileFilter.shouldIncludeFile(filePath);
    }

    /**
     * Retrieve the paths of all files in the group.
     * 
     * @param extensions {string[]} Optional file extensions used to filter the results.
     * 
     * @returns {Promise<string[]>} A promise that resolves to the file paths.
     */
    public async getFiles(...extensions: string[]): Promise<string[]> {
        let allFiles = new Set<string>();
        const includePatterns = this.fileFilter.includePatterns;
        const excludePatterns = this.fileFilter.excludePatterns;
        for (const includePattern of includePatterns) {
            const includeFiles = await findFiles(this.baseDir, includePattern, ...excludePatterns);
            
            includeFiles.forEach(
                includeFile => allFiles.add(includeFile)
            );
        }
        
        let contentFiles: string[] = Array.from(allFiles.values());
        contentFiles = contentFiles.filter(this.fileFilter.shouldIncludeFile);

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

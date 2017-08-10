import * as fs from 'mz/fs';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject } from './docfx-project';
import { TopicMetadata, TopicType, TopicChange, TopicChangeType } from './topic-metadata';

/**
 * Cache for topic metadata.
 */
export class MetadataCache {
    private readonly _topics: Map<string, TopicMetadata> = new Map<string, TopicMetadata>();
    private readonly _topicsByContentFile: Map<string, TopicMetadata[]> = new Map<string, TopicMetadata[]>();
    private readonly _topicChangeSubject: Rx.Subject<TopicChange> = new Rx.Subject<TopicChange>();
    private _docfxProject: DocFXProject = null;
    private _isPopulated = false;

    /**
     * A Promise representing the current cache-population task (if any).
     */
    private populatingPromise: Promise<boolean> = null;

    /**
     * The full path to the persisted cache file.
     */
    private get cacheFile(): string {
        return path.join(this.stateDirectory, 'topic-cache.json');
    }

    /**
     * Is the cache currently populated?
     */
    public get isPopulated(): boolean {
        return this._isPopulated;
    }

    /** The number of topics in the cache. */
    public get topicCount(): number {
        return this._topics.size;
    }

    /**
     * An observer for ongoing changes to topic metadata.
     */
    public get topicChanges(): Rx.Observer<TopicChange> {
        return this._topicChangeSubject;
    }

    /**
     * The cache's underlying DocFX project.
     */
    public get project(): DocFXProject {
        return this._docfxProject;
    }

    /**
     * The current project file (if any).
     */
    public get projectFile(): string {
        return this._docfxProject ? this._docfxProject.projectFile : null;
    }

    /**
     * Does the cache currently have an open project?
     */
    public get hasOpenProject(): boolean {
        return this._docfxProject !== null;
    }

    /**
     * Create a new topic metadata cache.
     * 
     * @param stateDirectory {string} The directory for persisted cache state.
     */
    constructor(private stateDirectory: string) {
        this._topicChangeSubject.subscribe(
            change => this.handleTopicChange(change).catch(
                error => console.log('Warning - error encountered by topic metadata cache: ' + error.message, error)
            ),
            error => console.log('Warning - error encountered by topic change observer: ' + error.message, error)
        );
    }

    /**
     * Get the metadata for the topic (if any) associated with the specified UID.
     * 
     * @param uid The target UID.
     * @returns The metadata, or null if no topic was found with the specified Id.
     */
    public getTopic(uid: string): TopicMetadata | null {
        return this._topics.get(uid) || null;
    }

    /**
     * Get metadata for some or all of the topics in the cache.
     * 
     * @param uidPrefix {string} If specified, only topics whose UID start with the specified prefix will be returned.
     * @returns {TopicMetadata[]} The topic metadata.
     */
    public getTopics(uidPrefix?: string): TopicMetadata[] {
        let topicMetadata = Array.from(this._topics.values());
        if (uidPrefix)
            topicMetadata = topicMetadata.filter(topic => topic.uid.startsWith(uidPrefix));

        topicMetadata.sort();

        return topicMetadata;
    }

    /**
     * Open a DocFX project.
     * 
     * @param docfxProjectFile {string} The DocFX project file.
     */
    public async openProject(docfxProjectFile: string): Promise<void> {
        if (this._docfxProject && this._docfxProject.projectFile === docfxProjectFile)
            return;

        // Only clear out existing workspace if we currently have another project open.
        const haveExistingProject = this._docfxProject !== null;
        await this.flush(haveExistingProject);

        this._docfxProject = await DocFXProject.load(docfxProjectFile);
    }

    /**
     * Close the current DocFX project (if any).
     */
    public async closeProject(): Promise<void> {
        if (!this.hasOpenProject)
            return;

        this._docfxProject = null;

        await this.flush();
    }

    /**
     * Flush the metadata cache.
     * 
     * @param clearWorkspaceState Also clear any state data persisted in workspace state?
     */
    public async flush(clearWorkspaceState?: boolean): Promise<void> {
        if (!this._isPopulated)
            return;

        this._topics.clear();
        this._topicsByContentFile.clear();
        this._isPopulated = false;
        
        if (clearWorkspaceState) {
            if (await fs.exists(this.cacheFile))
                await fs.unlink(this.cacheFile);
        }
    }

    /**
     * Persist the metadata cache state.
     */
    public async persist(): Promise<void> {
        const stateDirectory = path.dirname(this.cacheFile);
        if (!await fs.exists(stateDirectory))
            await fs.mkdir(stateDirectory);

        if (this._topics) {
            const stateData = JSON.stringify(Array.from(this._topics.values()), null, '    ');
            await fs.writeFile(this.cacheFile, stateData, { encoding: 'utf8' });
        } else if (await fs.exists(this.cacheFile)) {
            await fs.unlink(this.cacheFile);
        }
    }

    /**
     * Ensure that the cache is populated.
     * 
     * @param ignoreMissingProjectFile When true, then no alert will be displayed if no DocFX project file is found in the current workspace.
     * 
     * @returns {boolean} true, if the cache was successfully populated; otherwise, false.
     */
    public async ensurePopulated(): Promise<boolean> {
        if (!this.hasOpenProject)
            throw new MetadataCacheError('No DocFX project is currently open.');
        
        if (this.isPopulated)
            return true;

        if (this.populatingPromise)
            return await this.populatingPromise;

        const populatingPromise = this.populatingPromise = this.populate();

        return await populatingPromise.then((success: boolean) => {
            this.populatingPromise = null;

            return success;
        });
    }

    /**
     * Scan and parse the DocFX project contents.
     * 
     * TODO: Remove this function entirely, so the cache is initially populated by feeding a sequence of "create" topic changes.
     * 
     * @param progress An optional observer used to report cache-population progress.
     * 
     * @returns {boolean} true, if the cache was successfully populated; otherwise, false.
     */
    private async populate(progress?: Rx.Observer<string>): Promise<boolean> {
        this.ensureOpenProject();

        if (this._isPopulated)
            return true;

        this._isPopulated = await this.loadTopicMetadata(progress);

        return this._isPopulated;
    }

    /**
     * Load topic metadata into the cache.
     * 
     * @param progress An Observable<string> used to report progress.
     */
    private async loadTopicMetadata(progress: Rx.Observer<string>): Promise<boolean> {
        try {
            const projectFile = this._docfxProject.projectFile;
            const projectDir = this._docfxProject.projectDir;

            this._topics.clear();
            this._topicsByContentFile.clear();

            const topicMetadata: TopicMetadata[] = [];
            const persistedTopicCache = await this.loadTopicsFromCacheFile(progress);
            if (persistedTopicCache) {
                topicMetadata.push(...persistedTopicCache);
            } else {
                if (progress)
                    progress.next(`Scanning DocFX project "${projectFile}"...`);

                const projectTopics = await this._docfxProject.getTopics(progress);
                topicMetadata.push(...projectTopics);
            }

            topicMetadata.forEach(topic => {
                if (path.isAbsolute(topic.sourceFile)) {
                    topic.sourceFile = path.relative(projectDir, topic.sourceFile);
                }

                this._topics.set(topic.uid, topic);

                let contentFileTopics: TopicMetadata[] = this._topicsByContentFile.get(topic.sourceFile);
                if (!contentFileTopics) {
                    contentFileTopics = [];
                    this._topicsByContentFile.set(topic.sourceFile, contentFileTopics);
                }
                contentFileTopics.push(topic);
            });

            if (progress)
                progress.next(`Found ${this._topics.size} topics in DocFX project.`);

            await this.persist();

            return true;

        } catch (scanError) {
            console.log(scanError.stack);

            if (progress)
                progress.error(scanError);

            return false;
        }
    }

    /**
     * Load persisted topic metadata from the cache file (if it exists).
     * 
     * @param progress An Observable<string> used to report progress.
     * 
     * @returns {Promise<TopicMetadata[] | null>} A promise that resolves to the topic metadata, or null if the cache file does not exist.
     */
    private async loadTopicsFromCacheFile(progress: Rx.Observer<string>): Promise<TopicMetadata[] | null> {
        const cacheFile = path.join(this.stateDirectory, 'topic-cache.json');
        
        if (progress)
            progress.next(`Attempting to load DocFX topic metadata cache from "${cacheFile}"...`);

        if (!await fs.exists(cacheFile)) {
            if (progress)
                progress.next(`Cache file "${cacheFile}" not found.`);
        
            return null;
        }

        const metadata: TopicMetadata[] = JSON.parse(
            await fs.readFile(cacheFile, { encoding: 'utf-8' })
        );

        if (progress)
            progress.next(`Read ${metadata.length} topics from "${cacheFile}".`);

        return metadata;
    }

    /**
     * Handle a changed topic in the current workspace.
     * 
     * @param change A TopicChange representing the changed topic.
     */
    private async handleTopicChange(change: TopicChange): Promise<void> {
        if (!this._docfxProject.includesContentFile(change.contentFile))
            return;

        switch (change.changeType)
        {
            case TopicChangeType.Added:
            case TopicChangeType.Changed:
            {
                let contentFileTopics: TopicMetadata[] = this._topicsByContentFile.get(change.contentFile);
                if (contentFileTopics) {
                    contentFileTopics.forEach((topic: TopicMetadata) => {
                        this._topics.delete(topic.uid);
                    });
                }

                contentFileTopics = [];
                this._topicsByContentFile.set(change.contentFile, contentFileTopics);

                change.topics.forEach((topic: TopicMetadata) => {
                    this._topics.set(topic.uid, topic);

                    contentFileTopics.push(topic);
                });

                await this.persist();

                break;
            }
            case TopicChangeType.Removed:
            {
                const existingTopics: TopicMetadata[] = this._topicsByContentFile.get(change.contentFile);
                if (existingTopics) {
                    this._topicsByContentFile.delete(change.contentFile);
                    
                    existingTopics.forEach(existingTopic => {
                        this._topics.delete(existingTopic.uid);
                    });

                    this._topicsByContentFile.delete(change.contentFile);
                }

                await this.persist();
                
                break;
            }
            default:
            {
                console.log('Warning - received unexpected type of topic change notification.', change);

                break;
            }
        }
    }

    /**
     * Ensure that the cache has an open project.
     */
    private ensureOpenProject(): void {
        if (!this._docfxProject)
            throw new MetadataCacheError('No DocFX project is currently open.');
    }
}

/**
 * An error relating to the metadata cache.
 */
export class MetadataCacheError extends Error {
    /**
     * Should the error be displayed as a warning in the UI?
     */
    public isWarning: boolean;

    /**
     * Create a new MetadataCacheWarningError.
     * 
     * @param message The error message.
     */
    constructor(message: string, isWarning?: boolean) {
        super(message);

        this.isWarning = isWarning || false;
    }

    /**
     * Create a MetadataCacheError that should be displayed as a warning in the UI.
     * 
     * @param message The warning message.
     */
    public static warning(message: string): MetadataCacheError {
        return new MetadataCacheError(message, true);
    }
}

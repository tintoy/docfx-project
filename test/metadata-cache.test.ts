import { expect } from 'chai';
import 'mocha';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject, DocFXProjectData, DocFXProjectBuildData, FileGroupData, FileGroup } from '../src/docfx-project';
import { MetadataCache, MetadataCacheError } from '../src/metadata-cache';
import { TopicMetadata, TopicType, getFileTopics } from '../src/topic-metadata';
import { testProjectFiles, expectedContentFiles, expectedTopicMetadata, expectedTopicMetadataByUID } from './test-projects';
import { runAsync } from './utils/async';
import { deleteRecursive } from './utils/fs';

const stateDirectory = path.join(__dirname, 'state');
let metadataCache: MetadataCache = null;

describe('Metadata cache without open project', () => {
    beforeEach(done => runAsync(done, async () => {
        await deleteRecursive(stateDirectory);

        metadataCache = new MetadataCache(stateDirectory);
        expect(metadataCache.hasOpenProject).to.be.false;
    }));

    it('should throw a MetadataCacheError when attempting to retrieve topic "Index"', () => {
        expect(() => metadataCache.getTopic('Index')).to.throw(MetadataCacheError);
    });

    it('should throw a MetadataCacheError when attempting to retrieve all topic', () => {
        expect(() => metadataCache.getTopics()).to.throw(MetadataCacheError);
    });
});

describe('Metadata cache for simple project', () => {
    beforeEach(done => runAsync(done, async () => {
        await deleteRecursive(stateDirectory);

        metadataCache = new MetadataCache(stateDirectory);
        await metadataCache.openProject(testProjectFiles.simple);
        
        const isPopulated = await metadataCache.ensurePopulated();
        expect(isPopulated).to.be.true;
    }));

    it('should have topic "Index"', () => {
        const indexTopic = metadataCache.getTopic('Index');
        
        expect(indexTopic).to.not.be.null.and.deep.equal(
            expectedTopicMetadataByUID.simple['Index']
        );
    });
});

let messages: string[] = null;
describe('Metadata cache for simple project with existing state file', () => {
    beforeEach(done => runAsync(done, async () => {
        await deleteRecursive(stateDirectory);

        metadataCache = new MetadataCache(stateDirectory);
        await metadataCache.openProject(testProjectFiles.simple);
        
        let isPopulated = await metadataCache.ensurePopulated();
        expect(isPopulated).to.be.true;

        await metadataCache.closeProject();
        
        const progress = new Rx.Subject<string>();
        await metadataCache.openProject(testProjectFiles.simple);
        
        messages = [];
        progress.subscribe(
            message => messages.push(message),
            error => {
                console.log(error.stack);
                expect.fail(null, null, error.stack);
            }
        );

        isPopulated = await metadataCache.ensurePopulated(progress);
        expect(isPopulated).to.be.true;
    }));

    it('should load metadata from the state file', done => runAsync(done, async () => {
        expect(messages).to.contain(
            'Cache file exists; populating cache from state file.'
        );
    }));

    it('should have topic "Index"', () => {
        const indexTopic = metadataCache.getTopic('Index');
        
        expect(indexTopic).to.not.be.null.and.deep.equal(
            expectedTopicMetadataByUID.simple['Index']
        );
    });
});

describe('Metadata cache (unpopulated) for simple project', () => {
    beforeEach(done => runAsync(done, async () => {
        await deleteRecursive(stateDirectory);

        metadataCache = new MetadataCache(stateDirectory);
        await metadataCache.openProject(testProjectFiles.simple);

        expect(metadataCache.isPopulated).to.be.false;
    }));

    it('should not have topic "Index"', () => {
        const indexTopic = metadataCache.getTopic('Index');
        
        expect(indexTopic).to.be.null;
    });
});

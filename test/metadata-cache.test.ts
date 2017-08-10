import { expect } from 'chai';
import 'mocha';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject, DocFXProjectData, DocFXProjectBuildData, FileGroupData, FileGroup } from '../src/docfx-project';
import { MetadataCache } from '../src/metadata-cache';
import { TopicMetadata, TopicType, getFileTopics } from '../src/topic-metadata';
import { testProjectFiles, expectedContentFiles, expectedTopicMetadata, expectedTopicMetadataByUID } from './test-projects';
import { runAsync } from './utils/async';
import { deleteRecursive } from './utils/fs';

const stateDirectory = path.join(__dirname, 'state');
let metadataCache: MetadataCache = null;

describe('Metadata cache for simple project', () => {
    beforeEach(done => runAsync(done, async () => {
        deleteRecursive(stateDirectory);

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

describe('Metadata cache (unpopulated) for simple project', () => {
    beforeEach(done => runAsync(done, async () => {
        deleteRecursive(stateDirectory);

        metadataCache = new MetadataCache(stateDirectory);
        await metadataCache.openProject(testProjectFiles.simple);

        expect(metadataCache.isPopulated).to.be.false;
    }));

    it('should not have topic "Index"', () => {
        const indexTopic = metadataCache.getTopic('Index');
        
        expect(indexTopic).to.be.null;
    });
});

import { expect } from 'chai';
import 'mocha';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as Rx from 'rxjs';

import { TopicMetadata, TopicType, TopicChange, TopicChangeType } from '../src/topic-metadata';
import { observeTopicChanges } from '../src/topic-change-adapter';

import { TopicChangesFixture } from './fixtures/topic-changes';
import { runAsync, delay } from './utils/async';
import { deleteRecursive } from './utils/fs';

const stateDirectory = path.join(__dirname, 'state');

let topicChangesFixture: TopicChangesFixture = null;

describe('Topic change adapter', () => {
    beforeEach(done => runAsync(done, async () => {
        await deleteRecursive(stateDirectory);
        await fs.mkdir(stateDirectory);

        topicChangesFixture = new TopicChangesFixture(stateDirectory);

        await delay(100); // Ensure that chokidar doesn't treat our attempt to add the first file as an existing file.
    }));
    afterEach(() => {
        topicChangesFixture.close();
        topicChangesFixture = null;
    });

    it('should notify when a conceptual topic file is added', done => runAsync(done, async () => {
        const topicFile = path.join(stateDirectory, 'index.md');
        const expectedChange: TopicChange = {
            changeType: TopicChangeType.Added,
            contentFile: path.relative(stateDirectory, topicFile),
            topics: [
                {
                    detailedType: TopicType.Conceptual,
                    uid: 'Index',
                    name: 'Index',
                    title: 'The index',
                    type: 'Conceptual',
                    sourceFile: path.relative(stateDirectory, topicFile)
                }
            ]
        };

        await fs.writeFile(topicFile, `---
uid: Index
title: The index
---
        `);

        await topicChangesFixture.nextNotification();
        
        expect(topicChangesFixture.topicChanges.length).to.equal(1);
        expect(topicChangesFixture.topicChanges[0]).to.deep.equal(expectedChange);
    }));
});

import { expect } from 'chai';
import 'mocha';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject, DocFXProjectData, DocFXProjectBuildData, FileGroupData, FileGroup } from '../src/docfx-project';
import { TopicMetadata, TopicType, getFileTopics } from '../src/topic-metadata';
import { testProjectFiles, expectedContentFiles, expectedTopicMetadata } from './test-projects';

let project: DocFXProject;
let progress: Rx.Subject<string>;

describe('Simple project', () => {
    beforeEach(done => {
        DocFXProject.load(testProjectFiles.simple)
            .then(loadedProject => {
                project = loadedProject;

                done();
            })
            .catch(error => done(error));
    });

    it('should have the correct project file and directory path', () => {
        expect(project.projectFile).to.equal(testProjectFiles.simple);
        expect(project.projectDir).to.equal(
            path.dirname(testProjectFiles.simple)
        );
    });

    it('should include articles/index1.md', () => {
        const contentFile = path.join(project.projectDir, 'articles', 'index.md');
        const includesContentFile = project.includesContentFile(contentFile);

        expect(includesContentFile).to.equal(true);
    });

    it('should not include articles/folder1/index.md', () => {
        const contentFile = path.join(project.projectDir, 'folder1', 'index.md');
        const includesContentFile = project.includesContentFile(contentFile);

        expect(includesContentFile).to.equal(false);
    });

    it('should not include articles/excluded.md', () => {
        const contentFile = path.join(project.projectDir, 'articles', 'excluded.md');
        const includesContentFile = project.includesContentFile(contentFile);

        expect(includesContentFile).to.equal(false);
    });

    it('should return the correct content files', done => {
        project.getContentFiles()
            .then(contentFiles => {
                expect(contentFiles).to.deep.equal(expectedContentFiles.simple);

                done();
            })
            .catch(error => done(error));
    });

    it('should return the correct topic metadata', done => {
        project.getTopics()
            .then(topicMetadata => {
                expect(topicMetadata).to.deep.equal(expectedTopicMetadata.simple);

                done();
            })
            .catch(error => done(error));
    });
});

describe('Simple project with progress', () => {
    beforeEach(done => {
        progress = new Rx.Subject<string>();
        
        DocFXProject.load(testProjectFiles.simple)
            .then(loadedProject => {
                project = loadedProject;

                done();
            })
            .catch(error => done(error));
    });

    it('should return the correct topic metadata', done => {
        project.getTopics(progress)
            .then(topicMetadata => {
                expect(topicMetadata).to.deep.equal(expectedTopicMetadata.simple);

                done();
            })
            .catch(error => done(error));
    });
});

import { expect } from 'chai';
import 'mocha';
import * as path from 'path';
import * as Rx from 'rxjs';

import {
    DocFXProject,
    DocFXProjectData,
    DocFXProjectBuildData,
    FileGroupData,
    FileGroup
} from '../src/docfx-project';

import {
    TopicMetadata,
    TopicType,
    getFileTopics
} from '../src/topic-metadata';

const testProjectsDir = path.resolve(
    path.join(__dirname, '..', 'test', 'projects')
);
function getTestProjectFile(projectName: string): string {
    return path.join(testProjectsDir, projectName, 'docfx.json');
}
function getTestProjectContentFile(projectName: string, contentFile: string): string {
    return path.join(testProjectsDir, projectName, contentFile);
}

const testProjectFiles = {
    simple: getTestProjectFile('simple')
};

// Expected data
const expectedContentFiles = {
    simple: [
        getTestProjectContentFile('simple', 'articles/index.md')
    ]
};
const expectedTopicMetadata = {
    simple: [
        <TopicMetadata>{
            uid: 'Index',
            name: 'Index',
            title: 'Example article',
            detailedType: TopicType.Conceptual,
            sourceFile: getTestProjectContentFile('simple', 'articles/index.md'),
            type: 'Conceptual'
        }
    ]
};

let project: DocFXProject;
let progress: Rx.Subject<string>;

describe('Simple DocFX Project', () => {
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

describe('Simple DocFX Project with progress', () => {
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

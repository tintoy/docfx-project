import * as path from 'path';

import { TopicMetadata, TopicType } from '../src/topic-metadata';

/**
 * The directory containing DocFX project files used in tests.
 */
export const testProjectsDir = path.resolve(
    path.join(__dirname, 'projects')
);

/**
 * Well-known project files used in tests.
 */
export const testProjectFiles = {
    /**
     * A simple project with 1 conceptual topic.
     */
    simple: getTestProjectFile('simple')
};

/**
 * Expected content files for each project.
 */
export const expectedContentFiles = {
    /**
     * Expected content files for the simple project.
     */
    simple: [
        getTestProjectContentFile('simple', 'articles/index.md')
    ]
};

/**
 * Expected topic metadata for each project, keyed by UID.
 */
export const expectedTopicMetadataByUID = {
    /**
     * Expected topic metadata for the simple project.
     */
    simple: {
        'Index': <TopicMetadata>{
            uid: 'Index',
            name: 'Index',
            title: 'Example article',
            detailedType: TopicType.Conceptual,
            sourceFile: getTestProjectContentFile('simple', 'articles/index.md'),
            type: 'Conceptual'
        }
    }
};

/**
 * Expected topic metadata for each project.
 */
export const expectedTopicMetadata = {
    /**
     * Expected topic metadata for the simple project.
     */
    simple: [
        expectedTopicMetadataByUID.simple['Index']
    ]
};

/**
 * Get the base directory for the project with the specified name.
 * 
 * @param projectName The project name.
 */
export function getTestProjectFile(projectName: string): string {
    return path.join(testProjectsDir, projectName, 'docfx.json');
}

/**
 * Get a content file from the project with the specified name.
 * 
 * @param projectName The project name.
 */
export function getTestProjectContentFile(projectName: string, contentFile: string): string {
    return path.join(testProjectsDir, projectName, contentFile);
}

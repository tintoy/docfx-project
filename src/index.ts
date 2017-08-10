/*
 * The public API for docfx-project.
 */

export {
    DocFXProject,
    FileGroup,
    DocFXProjectData,
    DocFXProjectBuildData,
    FileGroupData
} from './docfx-project';

export {
    TopicMetadata,
    TopicType,
    TopicChange,
    TopicChangeType,
    getFileTopics
} from './topic-metadata';

export {
    observeTopicChanges
} from './topic-change-adapter';

export {
    FileFilter
} from './utils/file-filter';

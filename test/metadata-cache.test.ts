import { expect } from 'chai';
import 'mocha';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject, DocFXProjectData, DocFXProjectBuildData, FileGroupData, FileGroup } from '../src/docfx-project';
import { TopicMetadata, TopicType, getFileTopics } from '../src/topic-metadata';
import { testProjectFiles, expectedContentFiles, expectedTopicMetadata } from './test-projects';

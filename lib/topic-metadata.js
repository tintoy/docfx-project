"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("./utils/fs");
/**
 * Well-known topic types used to filter the topic quick-pick list.
 */
var TopicType;
(function (TopicType) {
    /** A conceptual topic. */
    TopicType[TopicType["Conceptual"] = 1] = "Conceptual";
    /** A namespace topic. */
    TopicType[TopicType["Namespace"] = 2] = "Namespace";
    /** A type (e.g. class, enum, etc) topic. */
    TopicType[TopicType["Type"] = 3] = "Type";
    /** A property topic. */
    TopicType[TopicType["Property"] = 4] = "Property";
    /** A method topic. */
    TopicType[TopicType["Method"] = 5] = "Method";
    /** A PowerShell Cmdlet topic. */
    TopicType[TopicType["PowerShellCmdlet"] = 6] = "PowerShellCmdlet";
    /** Some other type of topic (not a well-known topic type). */
    TopicType[TopicType["Other"] = 6] = "Other";
})(TopicType = exports.TopicType || (exports.TopicType = {}));
/**
 * Get metadata for the topic(s) defined in the specified content file.
 *
 * @param contentFile The full path of the content file.
 *
 * @returns { Promise<TopicMetadata[]> } A Promise that resolves to the topic metadata.
 */
function getFileTopics(contentFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const topics = [];
        if (contentFile.endsWith('.md')) {
            const conceptualTopic = yield parseMarkdownTopicMetadata(contentFile);
            if (!conceptualTopic)
                return [];
            conceptualTopic.detailedType = categorizeTopic(conceptualTopic);
            topics.push(conceptualTopic);
        }
        else if (contentFile.endsWith('.yml')) {
            const managedReferenceTopics = yield parseManagedReferenceYaml(contentFile);
            managedReferenceTopics.forEach(managedReferenceTopic => {
                managedReferenceTopic.detailedType = categorizeTopic(managedReferenceTopic);
                topics.push(managedReferenceTopic);
            });
        }
        return topics;
    });
}
exports.getFileTopics = getFileTopics;
/**
 * Determine the type of topic represented by the specified topic metadata.
 *
 * @param metadata The topic metadata.
 */
function categorizeTopic(metadata) {
    switch (metadata.type) {
        case 'Conceptual': {
            return TopicType.Conceptual;
        }
        case 'Reference.Managed': {
            switch (metadata.memberType) {
                case 'Namespace': {
                    return TopicType.Namespace;
                }
                case 'Class':
                case 'Struct':
                case 'Interface':
                case 'Delegate': {
                    return TopicType.Type;
                }
                case 'Property': {
                    return TopicType.Property;
                }
                case 'Method':
                case 'Constructor': {
                    return TopicType.Method;
                }
                default: {
                    return TopicType.Other;
                }
            }
        }
        case 'Reference.PowerShell': {
            switch (metadata.memberType) {
                case 'Cmdlet': {
                    return TopicType.PowerShellCmdlet;
                }
                default: {
                    return TopicType.Other;
                }
            }
        }
        default: {
            return TopicType.Other;
        }
    }
}
/**
 * Parse page metadata from a Markdown file's YAML front-matter.
 *
 * @param fileName The full path to the file.
 * @returns A promise that resolves to the page metadata (or null if the page metadata could not be parsed).
 */
function parseMarkdownTopicMetadata(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const topicMetadata = yield fs_1.readYamlFrontMatter(fileName);
        if (!topicMetadata)
            return null;
        if (!topicMetadata.uid)
            return null;
        topicMetadata.type = topicMetadata.type || 'Conceptual';
        topicMetadata.detailedType = TopicType.Conceptual;
        topicMetadata.name = topicMetadata.name || topicMetadata.uid;
        topicMetadata.title = topicMetadata.title || topicMetadata.name;
        topicMetadata.sourceFile = fileName;
        return topicMetadata;
    });
}
/**
 * Parse page metadata from DocFX managed-class-reference YAML.
 * @param fileName
 */
function parseManagedReferenceYaml(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const topicMetadata = [];
        const mrefYaml = yield fs_1.readYaml(fileName, 'ManagedReference' // Expected YAML MIME type.
        );
        if (!mrefYaml || !mrefYaml.items)
            return topicMetadata;
        for (const managedReference of mrefYaml.items) {
            if (!managedReference.uid)
                continue;
            topicMetadata.push({
                uid: managedReference.uid,
                type: 'Reference.Managed',
                memberType: managedReference.type,
                name: managedReference.fullName,
                title: managedReference.nameWithType,
                sourceFile: fileName
            });
        }
        return topicMetadata;
    });
}
//# sourceMappingURL=topic-metadata.js.map
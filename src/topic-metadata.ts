import { readYaml, readYamlFrontMatter } from './utils/fs';

/**
 * Represents the metadata for a DocFX topic.
 */
export interface TopicMetadata {
    /** The topic UID. */
    uid: string;

    /** The topic type. */
    type: string;

    /** The source file where the topic is defined. */
    sourceFile: string;

    /** The topic name. */
    name?: string;

    /** The topic title. */
    title?: string;

    /** The member type (for managed reference topics). */
    memberType?: string;

    /** The topic's detailed sub-type. */
    detailedType?: TopicType;
}

/**
 * Well-known topic types used to filter the topic quick-pick list.
 */
export enum TopicType {
    /** A conceptual topic. */
    Conceptual = 1,

    /** A namespace topic. */
    Namespace = 2,

    /** A type (e.g. class, enum, etc) topic. */
    Type = 3,

    /** A property topic. */
    Property = 4,

    /** A method topic. */
    Method = 5,

    /** A PowerShell Cmdlet topic. */
    PowerShellCmdlet = 6,

    /** Some other type of topic (not a well-known topic type). */
    Other = 6
}

/**
 * Get metadata for the topic(s) defined in the specified content file.
 * 
 * @param contentFile The full path of the content file.
 * 
 * @returns { Promise<TopicMetadata[]> } A Promise that resolves to the topic metadata.
 */
export async function getFileTopics(contentFile: string): Promise<TopicMetadata[]> {
    const topics: TopicMetadata[] = [];

    if (contentFile.endsWith('.md'))
    {
        const conceptualTopic = await parseMarkdownTopicMetadata(contentFile);
        if (!conceptualTopic)
            return [];

        conceptualTopic.detailedType = categorizeTopic(conceptualTopic);

        topics.push(conceptualTopic);
    } else if (contentFile.endsWith('.yml')) {
        const managedReferenceTopics = await parseManagedReferenceYaml(contentFile);
        managedReferenceTopics.forEach(managedReferenceTopic => {
            managedReferenceTopic.detailedType = categorizeTopic(managedReferenceTopic);
            topics.push(managedReferenceTopic);
        });
    }

    return topics;
}

/**
 * Determine the type of topic represented by the specified topic metadata.
 * 
 * @param metadata The topic metadata.
 */
function categorizeTopic(metadata: TopicMetadata): TopicType {
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
async function parseMarkdownTopicMetadata(fileName: string): Promise<TopicMetadata> {
    const topicMetadata = await readYamlFrontMatter<TopicMetadata>(fileName);
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
}

/** The root of a DocFX managed reference document. */
interface ManagedReferenceRoot {
    /** The managed reference items. */
    items: ManagedReferenceMetadata[];
}

/** The metadata for a DocFX managed reference. */
interface ManagedReferenceMetadata {
    /** The reference UID. */
    uid: string;

    /** The reference type (e.g. Namespace, Class, Method, etc). */
    type: string;

    /** The reference name. */
    name: string;

    /** The reference name, including enclosing CLR type. */
    nameWithType: string;

    /** The fully-qualified reference name, including enclosing namespace. */
    fullName: string;

    /** The Id of the XML doc comment from which the managed reference was extracted. */
    commentId: string;

    /** The type of member represented by the reference. */
    memberType: string;
}

/**
 * Parse page metadata from DocFX managed-class-reference YAML.
 * @param fileName 
 */
async function parseManagedReferenceYaml(fileName: string): Promise<TopicMetadata[]> {
    const topicMetadata: TopicMetadata[] = [];

    const mrefYaml = await readYaml<ManagedReferenceRoot>(fileName,
        'ManagedReference' // Expected YAML MIME type.
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
            name:managedReference.fullName,
            title: managedReference.nameWithType,
            sourceFile: fileName
        });
    }

    return topicMetadata;
}

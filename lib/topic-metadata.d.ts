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
export declare enum TopicType {
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
    Other = 6,
}
/**
 * Get metadata for the topic(s) defined in the specified content file.
 *
 * @param contentFile The full path of the content file.
 *
 * @returns { Promise<TopicMetadata[]> } A Promise that resolves to the topic metadata.
 */
export declare function getFileTopics(contentFile: string): Promise<TopicMetadata[]>;

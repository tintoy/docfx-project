import { IMinimatch } from 'minimatch';
/**
 * Read and parse file contents as JSON.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
export declare function readJson<T>(fileName: string): Promise<T>;
/**
 * Read and parse YAML from file contents.
 * @param fileName The name of the file to read.
 * @param expectedYamlMimeType An optional YAML MIME-type that must be matched (the file should start with "### YamlMime:expectedYamlMimeType").
 * @return The deserialised data.
 */
export declare function readYaml<T>(fileName: string, expectedYamlMimeType?: string): Promise<T>;
/**
 * Read and parse YAML front-matter from file contents.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
export declare function readYamlFrontMatter<T>(fileName: string): Promise<T>;
/**
 * Create Minimatch matchers for each of the specified patterns.
 *
 * @param patterns The glob-style patterns.
 *
 * @returns The matchers.
 */
export declare function createMatchers(...patterns: string[]): IMinimatch[];
/**
 * Find all files and directories matching a specific pattern.
 *
 * @param baseDir The base directory in which to start searching.
 * @param globPattern A globbing pattern describing the files to find.
 */
export declare function findFiles(baseDir: string, globPattern: string, ...excludeGlobPatterns: string[]): Promise<string[]>;

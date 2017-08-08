import { IMinimatch } from 'minimatch';
import { FileFilter } from './file-filter';
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
 * Recursively get a list of all files contained in the specified directory.
 *
 * @param baseDir The base directory to scan.
 */
export declare function getFilesRecursive(baseDir: string, filter?: FileFilter): Promise<string[]>;

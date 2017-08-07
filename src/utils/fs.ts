import { Minimatch, IMinimatch } from 'minimatch';
import * as glob from 'glob';
import * as yaml from 'js-yaml';
import * as fs from 'mz/fs';
import * as path from 'path';
import { loadFront } from 'yaml-front-matter';

/**
 * Find all files and directories matching a specific pattern.
 * 
 * @param baseDir The base directory in which to start searching.
 * @param globPattern A globbing pattern describing the files to find.
 */
export function findFiles(baseDir: string, globPattern: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
        const rawGlobOptions: glob.IOptions = {
            cwd: baseDir,
            nodir: true
        };
        const globber = new glob.Glob(globPattern, rawGlobOptions, (error, matches) => {
            if (!error)
            {
                matches = matches || []; // Matches will be null if there are no matching files.
                matches = matches.map(
                    match => path.join(baseDir, match)
                );

                resolve(matches); 
            }
            else
                reject(error);
        });
    });
}

/**
 * Read and parse file contents as JSON.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
export async function readJson<T>(fileName: string): Promise<T> {
    const buffer: Buffer = await fs.readFile(fileName);
    
    return <T>JSON.parse(
        buffer.toString()
    );
}

/**
 * Read and parse YAML from file contents.
 * @param fileName The name of the file to read.
 * @param expectedYamlMimeType An optional YAML MIME-type that must be matched (the file should start with "### YamlMime:expectedYamlMimeType").
 * @return The deserialised data.
 */
export async function readYaml<T>(fileName: string, expectedYamlMimeType?: string): Promise<T> {
    const fileContents: string = await fs.readFile(fileName, { encoding: 'utf8' });
    if (expectedYamlMimeType) {
        const yamlMimeTypePrefix = `### YamlMime:${expectedYamlMimeType}`;
        if (!fileContents.startsWith(yamlMimeTypePrefix))
            return null;
    }
    
    return <T>yaml.safeLoad(fileContents);
}

/**
 * Read and parse YAML front-matter from file contents.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
export async function readYamlFrontMatter<T>(fileName: string): Promise<T> {
    const buffer: Buffer = await fs.readFile(fileName);
    const frontMatter = loadFront(buffer);
    
    if (Object.getOwnPropertyNames(frontMatter).length === 1) // __content only (i.e. no front-matter)
        return null;

    delete frontMatter.__content;

    return <T>frontMatter;
}

/**
 * Create Minimatch matchers for each of the specified patterns.
 * 
 * @param patterns The glob-style patterns.
 * 
 * @returns The matchers.
 */
export function createMatchers(...patterns: string[]): IMinimatch[] {
    const matchers: IMinimatch[] = [];

    patterns.forEach(pattern => {
        const patternSegments = pattern.split('/');
        let hasUnsupportedGlobStar = false;
        for (const segment of pattern.split('/')) {
            if (segment.startsWith('**.')) {
                hasUnsupportedGlobStar = true;

                break;
            }
        }

        // **. -> [ *., **/*. ]
        if (hasUnsupportedGlobStar) {
            matchers.push(
                new Minimatch(pattern.replace('**.', '*.'))
            );
            matchers.push(
                new Minimatch(pattern.replace('**.', '**/*.'))
            );
        } else {
            matchers.push(
                new Minimatch(pattern)
            );
        }
    });

    return matchers;
}

/**
 * Recursively get a list of all files contained in the specified directory.
 * 
 * @param baseDir The base directory to scan.
 */
export async function getFilesRecursive(baseDir: string): Promise<string[]> {
    const scanState: TreeScanState = {
        directories: [],
        files: []
    };

    await scanDirectoryRecursive(baseDir, scanState);

    return scanState.files;
}

/** Represents the state data for recursively scanning a directory tree. */
interface TreeScanState {
    /** The full paths of directories discovered by the scan. */
    directories: string[];

    /** The full paths of files discovered by the scan. */
    files: string[];
}

/**
 * Recursively scan a directory for subdirectories and files.
 * 
 * @param baseDir The base directory to scan.
 * @param state The scan state.
 */
async function scanDirectoryRecursive(baseDir: string, state: TreeScanState): Promise<void> {
    const childNames: string[] = await fs.readdir(baseDir);
    for (const childName of childNames) {
        const childPath = path.join(baseDir, childName);
        const childStats = await fs.stat(childPath);
        if (childStats.isDirectory()) {
            state.directories.push(childPath);

            await scanDirectoryRecursive(childPath, state);
        } else {
            state.files.push(childPath);
        }
    }
}

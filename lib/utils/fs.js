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
const minimatch_1 = require("minimatch");
const yaml = require("js-yaml");
const fs = require("mz/fs");
const path = require("path");
const yaml_front_matter_1 = require("yaml-front-matter");
/**
 * Read and parse file contents as JSON.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
function readJson(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield fs.readFile(fileName);
        return JSON.parse(buffer.toString());
    });
}
exports.readJson = readJson;
/**
 * Read and parse YAML from file contents.
 * @param fileName The name of the file to read.
 * @param expectedYamlMimeType An optional YAML MIME-type that must be matched (the file should start with "### YamlMime:expectedYamlMimeType").
 * @return The deserialised data.
 */
function readYaml(fileName, expectedYamlMimeType) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContents = yield fs.readFile(fileName, { encoding: 'utf8' });
        if (expectedYamlMimeType) {
            const yamlMimeTypePrefix = `### YamlMime:${expectedYamlMimeType}`;
            if (!fileContents.startsWith(yamlMimeTypePrefix))
                return null;
        }
        return yaml.safeLoad(fileContents);
    });
}
exports.readYaml = readYaml;
/**
 * Read and parse YAML front-matter from file contents.
 * @param fileName The name of the file to read.
 * @return The deserialised data.
 */
function readYamlFrontMatter(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const buffer = yield fs.readFile(fileName);
        const frontMatter = yaml_front_matter_1.loadFront(buffer);
        if (Object.getOwnPropertyNames(frontMatter).length === 1)
            return null;
        delete frontMatter.__content;
        return frontMatter;
    });
}
exports.readYamlFrontMatter = readYamlFrontMatter;
/**
 * Create Minimatch matchers for each of the specified patterns.
 *
 * @param patterns The glob-style patterns.
 *
 * @returns The matchers.
 */
function createMatchers(...patterns) {
    const matchers = [];
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
            matchers.push(new minimatch_1.Minimatch(pattern.replace('**.', '*.')));
            matchers.push(new minimatch_1.Minimatch(pattern.replace('**.', '**/*.')));
        }
        else {
            matchers.push(new minimatch_1.Minimatch(pattern));
        }
    });
    return matchers;
}
exports.createMatchers = createMatchers;
/**
 * Recursively get a list of all files contained in the specified directory.
 *
 * @param baseDir The base directory to scan.
 */
function getFilesRecursive(baseDir, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const scanState = {
            baseDirectory: baseDir,
            directories: [],
            files: [],
            filter: filter
        };
        yield scanDirectoryRecursive(baseDir, scanState);
        return scanState.files;
    });
}
exports.getFilesRecursive = getFilesRecursive;
/**
 * Recursively scan a directory for subdirectories and files.
 *
 * @param relativeDirectory The base directory to scan.
 * @param state The scan state.
 */
function scanDirectoryRecursive(baseDirectory, state) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`scanDirectoryRecursive("${baseDirectory}")`);
        const relativeBaseDirectory = path.relative(state.baseDirectory, baseDirectory);
        console.log(`  relativeBaseDirectory = "${baseDirectory}"`);
        console.log('  ---------------------');
        console.log('');
        const childNames = yield fs.readdir(baseDirectory);
        console.log('  ChildNames: ', childNames);
        for (const childName of childNames) {
            const childRelativePath = path.join(path.relative(state.baseDirectory, baseDirectory));
            console.log(`  child("${childName}"): "${childRelativePath}"`);
            if (state.filter && !state.filter.shouldIncludeFile(childRelativePath)) {
                console.log(`  Exclude`);
                continue;
            }
            else {
                console.log(`  Include`);
            }
            const childPath = path.join(state.baseDirectory, childRelativePath);
            const childStats = yield fs.stat(childPath);
            if (childStats.isDirectory()) {
                state.directories.push(childPath);
                yield scanDirectoryRecursive(childPath, state);
            }
            else {
                state.files.push(childPath);
            }
        }
    });
}
//# sourceMappingURL=fs.js.map
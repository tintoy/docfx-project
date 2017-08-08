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
const glob = require("glob");
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
 * Find all files and directories matching a specific pattern.
 *
 * @param baseDir The base directory in which to start searching.
 * @param globPattern A globbing pattern describing the files to find.
 */
function findFiles(baseDir, globPattern, ...excludeGlobPatterns) {
    console.log(baseDir, globPattern, excludeGlobPatterns);
    return new Promise((resolve, reject) => {
        const rawGlobOptions = {
            cwd: baseDir,
            nodir: true,
            ignore: excludeGlobPatterns
        };
        const globber = new glob.Glob(globPattern, rawGlobOptions, (error, matches) => {
            if (!error) {
                matches = matches || []; // Matches will be null if there are no matching files.
                matches = matches.map(match => path.join(baseDir, match));
                resolve(matches);
            }
            else
                reject(error);
        });
    });
}
exports.findFiles = findFiles;
//# sourceMappingURL=fs.js.map
import * as fs from 'mz/fs';
import * as rimraf from 'rimraf';

/**
 * Recursively delete a file / directory
 * 
 * @param path The full path of the file / directory.
 */
export function deleteRecursive(path: string): Promise<void> {
    return new Promise((accept, reject) => {
        if (fs.existsSync(path)) {
            rimraf(path, error => {
                if (error)
                    reject(error);
                else
                    accept();
            });
        } else {
            accept();
        }
    });
}

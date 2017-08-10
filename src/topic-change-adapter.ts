import * as chokidar from 'chokidar';
import * as path from 'path';
import * as Rx from 'rxjs';

import { DocFXProject } from './docfx-project';
import { TopicChange, TopicChangeType, getFileTopics } from './topic-metadata';

/**
 * Observe changes to topics in content files contained in the workspace.
 * 
 * @param docfxProject { DocFXProject } The DocFX project for which topic changes will be observed.
 * @returns {Rx.Observable<TopicChange>} An observable sequence of {@link TopicChange} representing the changes.
 */
export function observeTopicChanges(baseDir: string): Rx.Observable<TopicChange> {
    return new Rx.Observable<TopicChange>(subscriber => {
        async function notify(filePath: string, changeType: TopicChangeType): Promise<void> {
            const changeNotification: TopicChange = {
                changeType: changeType,
                contentFile: path.relative(baseDir, filePath)
            };

            if (changeType !== TopicChangeType.Removed)
                changeNotification.topics = await getFileTopics(filePath);

            subscriber.next(changeNotification);
        }

        const contentFileGlobs = [
            path.join(baseDir, '**', '*.md'),
            path.join(baseDir, '**', '*.yml')
        ];
        const watcher = chokidar.watch(contentFileGlobs, {
            ignoreInitial: true,
            usePolling: false
        });

        watcher.on('add', (filePath: string) => {
            notify(filePath, TopicChangeType.Added).catch(
                error => subscriber.error(error)
            );
        });
        watcher.on('change', (filePath: string) => {
            notify(filePath, TopicChangeType.Changed).catch(
                error => subscriber.error(error)
            );
        });
        watcher.on('unlink', (filePath: string) => {
            notify(filePath, TopicChangeType.Removed).catch(
                error => subscriber.error(error)
            );
        });
        
        return () => {
            watcher.close();
        };
    });
}

import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as Rx from 'rxjs';

import { TopicMetadata, TopicType, TopicChangeType, getFileTopics, TopicChange } from '../../src/topic-metadata';
import { observeTopicChanges } from '../../src/topic-change-adapter';

/**
 * Test fixture for capturing topic-change notifications.
 */
export class TopicChangesFixture {
    private _topicChangeObservable: Rx.Observable<TopicChange>;
    private _publisherConnection: Rx.Subscription;
    private _topicChangeSubscription: Rx.Subscription;
    
    /**
     * Topic-change notifications captured by the fixture.
     */
    public readonly topicChanges: TopicChange[] = [];

    /**
     * An observable for topic-change notifications.
     */
    public get topicChangeObservable(): Rx.Observable<TopicChange> {
        return this.topicChangeObservable;
    }

    /**
     * Create a new topic-change notification fixture.
     * 
     * @param baseDir The base directory to monitor for changes.
     */
    constructor(private baseDir: string) {
        const topicChangePublisher = observeTopicChanges(this.baseDir).publish(); // Multiple subscribers.
        
        this._topicChangeObservable = topicChangePublisher;
        this._topicChangeSubscription = this._topicChangeObservable.subscribe(
            topicChange => this.topicChanges.push(topicChange),
            error => expect.fail(null, null, error.stack)
        );

        this._publisherConnection = topicChangePublisher.connect();
    }

    /**
     * Clean up the fixture; stop listening for changes.
     */
    public close(): void {
        if (this._topicChangeSubscription) {
            this._topicChangeSubscription.unsubscribe();
            this._topicChangeSubscription = null;
        }

        if (this._publisherConnection) {
            this._publisherConnection.unsubscribe();
            this._publisherConnection = null;
        }

        this._topicChangeObservable = null;
    }

    /**
     * Create a promise representing the next notification.
     * 
     * @returns {Promise<TopicChange>} A promise that resolves to the next topic-change notification or an error.
     */
    public nextNotification(): Promise<TopicChange> {
        let subscription: Rx.Subscription;

        return new Promise<TopicChange>((accept, reject) => {
            subscription = this._topicChangeObservable.subscribe(
                topicChange => {
                    accept(topicChange);
                },
                error => {
                    reject(error);
                }
            );
        }).then(topicChange => {
            subscription.unsubscribe();

            return topicChange;
        }).catch(error => {
            subscription.unsubscribe();

            return error;
        });
    }
}

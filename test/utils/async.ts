/**
 * Run an asynchronous action as part of a test.
 * 
 * @param done The Mocha `done` function.
 * @param action The asynchronous action to perform.
 */
export function runAsync(done: MochaDone, action: () => Promise<void>): void {
    action()
        .then(() => {
            done();
        })
        .catch(error => {
            done(error);
        });
}

# docfx-project

A NodeJS library for working with DocFX projects and their content.

```typescript
const project: DocFXProject = await DocFXProject.load('./docs/docfx.json');
const contentFiles: string[] = await project.getContentFiles('.md', '.yml');
const topics: TopicMetadata[] = await project.getTopics();

const progressSubject = new Rx.Subject<string>(
    message => console.log(message),
    error => console.log(error)
);
const topicsWithProgress: TopicMetadata[] = await project.getTopics(progressSubject);
```

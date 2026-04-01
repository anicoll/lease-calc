# jj (Jujutsu) VCS Tips and Workflows

## What is Jujutsu?

Jujutsu is a backcronym of a tool `jj`.

## What is `jj`?

`jj` is a version control tool that provides a better experience for managing git repositories through:

- an abstraction over git's immutable commit graph with a mutable revision graph
- consistent and composable commands for interacting with the graph
- a functional DSL for declaring / selecting revisions to operate on called revsets
- an operation log of all executed commands, with ability to revert to a previous state i.e. command history + undo (the op log itself is a DAG)
- first-class conflict management
- advanced workflows which are impossible in plain git

You can read more about the core tenets[^core-tenets] and concepts[^concepts] in the official docs.

There are many[^tut1] tutorials[^tut2] online[^tut3] which explain the setup and concepts.
Instead, this doc will outline some workflows that `jj` enables which will hopefully entice you into trying it out.
Otherwise, you can read the many glowing testimonials[^testimonials]

## Workflows

### `jj squash`

- Squashes current revision into the previous revision
- Revisions are lightweight (can be created without descriptions)
- Useful for experimenting:
  create revision → test → either squash, abandon, or keep

> Note: A revision is the fundamental primitive of the `jj` graph.
> It is a freer version of a commit in a git DAG in that you
>
> - can create a revision before you add any code
> - you don't need to provide a description up front
> - you can freely make changes to code in a revision
> - and the code is automatically checked into `jj` store when you invoke any `jj` command.

### Stacked PRs

- Stacked PRs correspond to sequences of bookmarked revisions
- When PRs are squash-merged, conflicts arise in git between the diverging commit history
- However with `jj` revisions are decoupled from commits, you can easily rebase the stack onto the main branch commit
- Use revset DSL or `jjui` for interactive selection and movement of changes
- I almost never deal with merge conflicts anymore when rebasing my PR stack

> Note: A bookmark is similar to a branch in git.
> Except that a branch always points to the HEAD, whereas a bookmark points to any revision.
> This means you can have multiple bookmarks for a sequence of revisions and move them around as needed.
> This also means when you want to synchronise a remote branch with the local bookmark, you will need to manually move the bookmark to the desired change.
> This area is undergoing feedback and development, so there may be an option in the future to automatically move your bookmarks.

### `jj split`

- Splits a revision into two separate revisions
- Interactive TUI showing a diff for selecting specific changes to pull out
- The workflow this enables is grooming a sequence of revisions (or a single large revision) into smaller chunks.

### `jj absorb`

- Works on new changes atop a revision stack
- Automatically squashes changes into the appropriate revision when unambiguous

As an example, say you have three changes:

1. Implement pkg + unit tests
2. Update documentation
3. Use pkg in service code

As part of change 3. you realise you forgot an edge case.
You can continue editing in revision 3 and add your test case and update the documentation.
Then `jj absorb` will update 1 and 2 with the relevant changes you have made from 3, leaving the service code in 3 which is quite magical.

> Note: A workflow that some people use for this is to have multiple revisions from separate feature branches merged into a new merge revision aka "megamerge"[^megamerge] and develop on this integrated WIP commit.
> Then `jj absorb` will update the relevant revisions when needed.
> This is quite advanced but very powerful, and not possible with plain git.

### `jj workspace add ../wip`

- Similar to git worktree
- Creates a copy of the repository in the specified directory
- Maintains full `jj` DAG access
- Allows running tools, tests, codegen on one revision while working on another

### Claude

`jj` is useful for managing repo state for claude.
I like to use `jj workspace add` to run claude on a particular revision in parallel to another task.
You might be able to manage multiple instances of claude if you can handle the context switching.

Another useful thing with `jj` is checkpointing claude changes using `jj new`.
If you can provide a description if desired, otherwise you can quickly test out an idea and either `jj abandon` or squash the changes down.

### Tips

Customise the default command to show a snippet of the log graph, filtered on my revisions.
The default is to run the `jj log` command, which is a paged view of all the logs.
This takes up a full screen in the terminal, and I usually want some context of my previous commands for my next action.
I also usually don't care about other peoples changes when navigating with jj.

```toml
[ui]
default-command = ["log", "--limit", "10", "-r", "@ | ancestors(trunk()..(visible_heads() & mine()), 2) | trunk()"]
```

Add a `tug` command to move the nearest bookmark after syncing with the git remote.

```
[aliases]
# tug - move the nearest bookmark to the nearest non-empty change at or before @
tug = ["bookmark", "move", "--from", "closest_bookmark(@)", "--to", "closest_nonempty(@)"]
# tugp - tug to the nearest change before @ (i.e. tug to previous revision, or skip current revision)
tugp = ["bookmark", "move", "--from", "closest_bookmark(@)", "--to", "closest_nonempty(@-)"]

[revset-aliases]
'closest_bookmark(to)' = 'heads(::to & bookmarks())'
'closest_nonempty(to)' = 'heads(::to ~ empty())'
```

## Resources

- [Advanced Tips and Tricks](https://andre.arko.net/2025/09/28/stupid-jj-tricks/)
- [Jujutsu contributor config](https://gist.github.com/thoughtpolice/8f2fd36ae17cd11b8e7bd93a70e31ad6)

[^core-tenets]: <https://jj-vcs.github.io/jj/latest/core_tenets/>

[^concepts]: <https://jj-vcs.github.io/jj/latest/glossary/>

[^tut1]: <https://steveklabnik.github.io/jujutsu-tutorial/>

[^tut2]: <https://v5.chriskrycho.com/essays/jj-init/>

[^tut3]: <https://maddie.wtf/posts/2025-07-21-jujutsu-for-busy-devs>

[^testimonials]: <https://jj-vcs.github.io/jj/latest/testimonials/>

[^megamerge]: <https://v5.chriskrycho.com/journal/jujutsu-megamerges-and-jj-absorb/>

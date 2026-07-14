# 🌿 Linux Commands — Git

> Git is a distributed version control system that tracks code changes.  
> In Bandit's final section (Levels 27-31) we used git's different features  
> one by one — from cloning to pushing, from branches to tags.

---

## 📋 Table of Contents

- [What Is Git?](#what-is-git)
- [git clone](#git-clone)
- [git log](#git-log)
- [git show](#git-show)
- [git branch](#git-branch)
- [git checkout](#git-checkout)
- [git tag](#git-tag)
- [git add](#git-add)
- [git commit](#git-commit)
- [git push](#git-push)
- [git diff](#git-diff)
- [git status](#git-status)
- [.gitignore](#gitignore)
- [Git Security Vulnerabilities](#git-security-vulnerabilities)

---

## What Is Git?

Git is a system that tracks changes in files. Each "commit" is a snapshot of the state at that moment.

```
Project History:
  commit A (first)  →  commit B  →  commit C (last)
      "init"           "feature"    "fix"
```

### Core Concepts

| Concept | Description |
|---|---|
| **Repository (Repo)** | All of a project's files + history |
| **Commit** | A saved snapshot of changes |
| **Branch** | A parallel line of development |
| **Tag** | A label marking important points |
| **Remote** | A repo on a remote server (like GitHub) |
| **Clone** | A local copy of a remote repo |
| **Push** | Sending local changes to a remote |
| **Pull** | Fetching remote changes to local |
| **Merge** | Combining branches |
| **HEAD** | The commit you're currently on |

### Git Structure

```
Working Directory → Staging (git add) → Local Repo (git commit) → Remote Repo (git push)
```

---

## git clone

Copies a remote repo to your local machine.

### Basic Usage
```bash
git clone https://github.com/user/repo
git clone https://github.com/user/repo target-folder
git clone ssh://user@host/path/repo
git clone ssh://user@host:port/path/repo
```

### Important Flags

| Flag | Description |
|---|---|
| `--depth 1` | Get only the last commit (fast) |
| `--branch <branch>` | Clone a specific branch |
| `--single-branch` | Only one branch |
| `-q` | Quiet mode |

### Protocols

```bash
# HTTPS (username/password)
git clone https://github.com/user/repo

# SSH (with a key)
git clone git@github.com:user/repo

# Local (used in Bandit)
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
```

### Usage in Bandit
```bash
# Level 27: clone the repo
cd $(mktemp -d)
git clone ssh://bandit27-git@localhost:2220/home/bandit27-git/repo
# it asks for a password → enter bandit27's password
cd repo
cat README
```

---

## git log

Shows the commit history.

### Basic Usage
```bash
git log                     # the full history
git log --oneline           # a short summary (1 line/commit)
git log -n 5                # the last 5 commits
git log --all               # commits across all branches
git log --graph             # branch graph
git log --oneline --graph --all  # a nice summary
```

### Example Output

```bash
$ git log
commit edd935d60906b33f0619605abd1689808ccdd5ee
Author: Morla Pussygato <morla@overthewire.org>
Date:   Thu May 7 2020 ...

    fix info leak        ← commit message

commit c086d11b00cad37ed77e1abf54c4bde3dfba15bb
...

    add missing data
```

### Flags

| Flag | Description |
|---|---|
| `--oneline` | Each commit on a single line |
| `--graph` | ASCII branch graph |
| `--all` | All branches and tags |
| `-n N` | The last N commits |
| `--author="name"` | Commits by a specific author |
| `--since="2024-01-01"` | From a specific date onward |
| `--grep="word"` | Search in commit messages |
| `-p` | Also show the changes |
| `--stat` | Statistics of file changes |

### Usage in Bandit
```bash
# Level 28: the password is hidden in the commit history
git log
# commit edd935d...  "fix info leak" ← suspicious!
git show edd935d...
```

---

## git show

Shows the details of a commit or tag.

### Basic Usage
```bash
git show                    # the last commit's changes
git show <commit_id>        # a specific commit
git show HEAD               # the last commit
git show HEAD~1             # the one before last
git show <tag_name>         # a tag's details
```

### Reading the Output

```bash
$ git show edd935d...
commit edd935d...
Author: ...
Date: ...

    fix info leak

diff --git a/README.md b/README.md
index ...
--- a/README.md
+++ b/README.md
@@ -4,3 +4,3 @@
 username: natas9
-password: <eski şifre — git geçmişinde kalmış>   ← OLD (removed)
+password: xxxxxxxxxx                            ← NEW (added)
```

Lines starting with `-` were removed, lines starting with `+` were added.

### Usage in Bandit
```bash
# Level 28: show the commit where the password was removed
git show edd935d60906b33f0619605abd1689808ccdd5ee
# - password: <OLD_PASSWORD>   ← this is what we're looking for
# + password: xxxxxxxxxx
```

---

## git branch

Lists, creates, or deletes branches.

### Basic Usage
```bash
git branch                  # list local branches
git branch -a               # all branches (including remote)
git branch -r               # remote branches only
git branch new-branch       # create a new branch
git branch -d branch-name   # delete a branch (must be merged)
git branch -D branch-name   # force delete
```

### Branch Naming Conventions

```
master / main   → production code
dev             → development
feature/login   → new feature
bugfix/login    → bug fix
hotfix/login    → urgent fix
```

### Example Output

```bash
$ git branch -a
* master                          ← * = where you currently are
  remotes/origin/dev              ← remote branch
  remotes/origin/master
  remotes/origin/sploits-dev
```

### Usage in Bandit
```bash
# Level 29: list all branches
git branch -a
# remotes/origin/dev ← no password in production, but there is in dev!

git checkout dev
cat README.md   # the password is here
```

---

## git checkout

Switches to a branch or commit.

### Basic Usage
```bash
git checkout branch-name        # switch to a branch
git checkout -b new-branch      # create a new branch and switch to it
git checkout <commit_id>        # go to a specific commit (detached HEAD)
git checkout -- file.txt        # revert a file to the last commit
```

### Switching Branches

```bash
# switch to a remote branch
git checkout dev
# or the full path:
git checkout -b dev origin/dev

# create a new branch and switch
git checkout -b feature/login
```

### Detached HEAD

```bash
git checkout abc1234
# HEAD is no longer a branch, it points directly to that commit
# Warning: detached HEAD state
```

### Usage in Bandit
```bash
# Level 29: switch to the dev branch
git checkout dev
cat README.md   # the password!
```

---

## git tag

Creates or lists tags. Tags mark important points (like version numbers).

### Basic Usage
```bash
git tag                     # list tags
git tag v1.0                # create a lightweight tag
git tag -a v1.0 -m "message" # annotated tag (with a message)
git show v1.0               # show a tag's details
git tag -d v1.0             # delete a tag
```

### Tag Types

```bash
# lightweight (a simple marker)
git tag v1.0

# annotated (with a message, signed)
git tag -a v1.0 -m "Version 1.0 released"
```

### Usage in Bandit
```bash
# Level 30: README is empty, log has one commit, no branches...
git tag
# secret    ← a hidden tag!

git show secret
# <the password appears here>
```

---

## git add

Adds modified files to the "staging area." A preparation area before committing.

### Basic Usage
```bash
git add file.txt            # add a single file
git add .                   # add all changes in the current directory
git add -A                  # add all changes (including deletions)
git add -p                  # add changes piece by piece (interactive)
git add -f file.txt         # force add despite .gitignore
```

### The -f (force) Flag

Files listed in `.gitignore` normally can't be added with `git add`. The `-f` flag forces it:

```bash
# .gitignore contains *.txt
cat .gitignore
# *.txt

git add key.txt         # error! it's in gitignore
git add -f key.txt      # force add!
```

### Usage in Bandit
```bash
# Level 31: .gitignore blocks *.txt
cat .gitignore    # *.txt

echo 'May I come in?' > key.txt
git add -f key.txt  # force add
git commit -m "add key"
git push
```

---

## git commit

Permanently saves the changes in the staging area.

### Basic Usage
```bash
git commit -m "Commit message"      # commit with a message
git commit -am "Message"            # add + commit (for tracked files)
git commit --amend                  # amend the last commit
git commit --amend -m "New message" # change the last commit message
```

### Writing a Good Commit Message

```bash
# BAD
git commit -m "fix"
git commit -m "aaa"

# GOOD
git commit -m "feat: add user login page"
git commit -m "fix: fix the password reset bug"
git commit -m "docs: update the README"
```

### Conventional Commits

```
feat:     new feature
fix:      bug fix
docs:     documentation
style:    formatting change
refactor: code restructuring
test:     adding/editing tests
chore:    maintenance work
```

### Usage in Bandit
```bash
# Level 31: save the changes
git add -f key.txt
git commit -m "add key"
git push
```

---

## git push

Sends local commits to the remote repo.

### Basic Usage
```bash
git push                            # push the current branch
git push origin main                # a specific remote and branch
git push -u origin main             # set the upstream and push
git push --force                    # force push (careful!)
git push origin --delete branch     # delete a remote branch
```

### The First Push

```bash
# if there's no remote connection, add one
git remote add origin https://github.com/user/repo.git

# set the upstream
git push -u origin main
# next times, just "git push" is enough
```

### Authentication

```bash
# HTTPS (username + token)
git push    # asks for username and password/token

# SSH (automatic with a key)
git remote set-url origin git@github.com:user/repo.git
git push    # doesn't ask for a password
```

### Usage in Bandit
```bash
# Level 31: push, and the remote gives the password
git push -u origin master
# remote: Well done! Here is the password:
# remote: <password>
```

---

## git diff

Compares changes.

### Basic Usage
```bash
git diff                    # working directory vs staging
git diff --staged           # staging vs the last commit
git diff HEAD               # working directory vs the last commit
git diff branch1 branch2    # compare two branches
git diff <commit1> <commit2>  # compare two commits
```

---

## git status

Shows the state of the working directory.

### Basic Usage
```bash
git status                  # show the state
git status -s               # a short summary
```

### Example Output

```bash
$ git status
On branch main
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        new file:   key.txt        ← in staging

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
        modified:   README.md      ← modified but not added

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        temp.txt                   ← git doesn't know about it
```

---

## .gitignore

Specifies which files git should **ignore**.

### Syntax

```gitignore
# comment line
*.log           # all .log files
*.txt           # all .txt files
build/          # the build folder
!README.txt     # don't ignore README.txt (exception)
/root.txt       # only root.txt in the root directory
doc/*.txt       # .txt files in the doc folder
**/*.log        # .log files in all subdirectories
```

### Usage in Bandit
```bash
# Level 31: .gitignore blocks *.txt
cat .gitignore
# *.txt

# but it can be bypassed with -f
git add -f key.txt
```

---

## Git Security Vulnerabilities

The critical security lessons we learned in Bandit:

### 1. Git History Keeps Everything

```bash
# even if you delete a file, it stays in the history!
git rm password.txt
git commit -m "removed the password"

# but it's still accessible:
git log --all
git show <old_commit>
# the password is still here!
```

**Solution:** Never commit sensitive data at all. Use tools like `git-secrets` and `gitleaks`.

### 2. Check All Branches

```bash
# don't just look at main!
git branch -a
git checkout dev   # there might be information in another branch
```

### 3. Tags Can Contain Secrets

```bash
git tag
git show <tag>   # there might be sensitive information
```

### 4. .gitignore Is Not Security

`.gitignore` doesn't hide files, it just doesn't track them. Files that are already committed are still visible.

---

## 📚 Quick Reference Table

| Command | Usage | What It Does |
|---|---|---|
| `git clone` | `git clone <url>` | Download a repo |
| `git log` | `git log --oneline` | Commit history |
| `git show` | `git show <id>` | Commit details |
| `git branch -a` | `git branch -a` | All branches |
| `git checkout` | `git checkout dev` | Switch branches |
| `git tag` | `git tag` | List tags |
| `git show <tag>` | `git show secret` | Tag contents |
| `git add -f` | `git add -f file` | gitignore bypass |
| `git commit -m` | `git commit -m "msg"` | Save changes |
| `git push` | `git push` | Send to the remote |
| `git status` | `git status` | Show the state |
| `git diff` | `git diff` | Show changes |

---

## 🔗 More Information

- [Official Git Documentation](https://git-scm.com/doc)
- [Pro Git Book](https://git-scm.com/book/en/v2)
- [GitHub Guides](https://guides.github.com/)
- [Learn Git Branching](https://learngitbranching.js.org/) — interactive learning
- [gitleaks](https://github.com/gitleaks/gitleaks) — detect sensitive data in git

---

**Previous section:** [process_shell.md](./process_shell.md)

*This guide is part of the [waitaseC137/linux_learning](https://github.com/waitaseC137/linux_learning) repository.*

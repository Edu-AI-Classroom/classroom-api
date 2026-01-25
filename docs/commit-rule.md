# Git Commit Convention

This document defines the **mandatory commit message convention** for this repository. The goal is to ensure commit messages are:

- Easy to read and review
- Machine-parseable (commitlint, semantic-release)
- Useful for CI/CD, changelogs, and automated releases

---

## 1. Standard

This repository follows **Conventional Commits**.

**General format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

Where:

- `type` (required): the type of change
- `scope` (recommended): the affected area (app/lib/domain)
- `subject` (required): a short description
- `body`, `footer`: optional

---

## 2. Allowed commit types

Only the following types are allowed:

| Type     | Usage                         |
| -------- | ----------------------------- |
| feat     | New feature                   |
| fix      | Bug fix                       |
| docs     | Documentation only            |
| style    | Formatting (no logic changes) |
| refactor | Code refactoring              |
| perf     | Performance improvements      |
| test     | Add or update tests           |
| build    | Build system or tooling       |
| ci       | CI/CD configuration           |
| chore    | Maintenance tasks             |
| revert   | Revert a commit               |

❌ Do not introduce custom types.

---

## 3. Scope

The scope describes **what part of the system is affected**.

Valid examples:

- Application name: `web`, `admin`
- Library name: `auth`, `ui`, `shared`
- Domain: `user`, `payment`

Examples:

```
feat(auth): add refresh token support
fix(web): handle empty dashboard state
chore(deps): bump axios to v1.6.2
```

---

## 4. Subject line

**Rules:**

- Use imperative mood (present tense)
- Lowercase
- No trailing period
- Max 100 characters

✅ Correct:

```
feat(auth): add refresh token support
fix(user): handle null avatar
```

❌ Incorrect:

```
feat(auth): Added refresh token
fix(user): Fixed bug
update code
```

---

## 5. Body (optional but recommended)

Use the body for **non-trivial changes** to explain _why_ the change was made.

Example:

```
refactor(auth): simplify token validation

Remove duplicated logic between access token
and refresh token validation.
```

---

## 6. Footer & Breaking changes

For breaking changes:

```
feat(api): change login response format

BREAKING CHANGE: login API no longer returns user.profile
```

---

## 7. Disallowed commits

The following commit messages will be rejected by CI:

```
fix bug
update code
WIP
abc
commit 1
```

---

## 8. Enforcement

This convention is enforced by:

- Husky (git hooks)
- commitlint (local and CI)

👉 Commits that do not follow this convention **cannot be merged**.

---

## 9. TL;DR

- One commit = one clear logical change
- Always follow Conventional Commits
- CI is the final authority

If you are unsure about the correct type or scope, ask the team before committing.

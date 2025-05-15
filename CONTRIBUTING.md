### ✅ 2. Contributing Guide (`CONTRIBUTING.md`)

````md
# Contributing to Sendexa SMPP Server

We welcome contributions from developers around the world.

## Setup
1. Fork the repository
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sendexa-smpp.git
   cd sendexa-smpp
   npm install
   npm run dev
````

## Guidelines

* Use TypeScript.
* Keep code clean and linted (`npm run lint`).
* Use meaningful commit messages.
* Add comments where necessary.

## Feature Ideas

* Add more telco routing logic
* Build a delivery simulator
* Improve NCA compliance handlers
* Write unit tests for `smpp-core`

## Submitting

1. Push your changes to your fork.
2. Open a Pull Request with a clear description.

````

---

### ✅ 3. GitHub Issue Templates (`.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`)

**Bug Report**
```md
---
name: Bug Report
about: Report a bug in the SMPP server
title: "[Bug]"
labels: bug
assignees: cephasbartworks

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Send '...'
3. See error

**Expected behavior**
A clear explanation of what you expected to happen.

**Environment**
- OS:
- Node version:
- SMPP version:
````

**Feature Request**

```md
---
name: Feature Request
about: Suggest a new feature for Sendexa SMPP
title: "[Feature]"
labels: enhancement
assignees: cephasbartworks

---

**What problem are you trying to solve?**

**Describe the solution you'd like**

**Any additional context**
```
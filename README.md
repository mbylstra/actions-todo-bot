# Kaizen Contributor Checklist
This action parses PR description and set commit status to success if there are no unfilled checkboxes
related to Kaizen contributions.

## Using the Action

Create a new workflow YAML file under `.github/workflows/` folder.

Example:

```
name: Kaizen Contributor Checklist

on:
  pull_request:
    types: [opened, synchronize, reopened, edited]

jobs:
  check:

    runs-on: ubuntu-latest

    steps:
    - uses: mbylstra/kaizen-contributor-checklist@1.0.0
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
```

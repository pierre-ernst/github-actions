# Detect-secrets sarif

![detect-secrets status](https://github.com/pierre-ernst/github-actions/workflows/Run%20detect-secrets%20baseline/badge.svg)[![Known Vulnerabilities](https://snyk.io/test/github/pierre-ernst/github-actions/badge.svg?targetFile=detect-secrets-sarif/package.json)](https://snyk.io/test/github/pierre-ernst/github-actions?targetFile=detect-secrets-sarif/package.json)

A GitHub action that converts detect-secrets [json output file](https://github.com/Yelp/detect-secrets/blob/master/test_data/baseline.file) to [sarif format](https://docs.oasis-open.org/sarif/sarif/v2.0/sarif-v2.0.html). This action is useful when combined with the [GitHub upload sarif action](https://github.com/github/codeql-action/tree/main/upload-sarif), to push detect-secrets finding to the security tab:

![screenshot of GitHub security tab with detect-secrets findings](https://user-images.githubusercontent.com/18272293/100271283-3b4c0580-2f27-11eb-868b-2dc57efcaef2.png)

Some finding examples can be found on the [security tab](../security/code-scanning?query=tool%3Adetect-secrets) of this repo.


## Action inputs

| Name | Description | Required |
| --- | --- | ---|
| `baseline-file-location` | Indicates whether the baseline file should be read from the local file system (`local`) or the repo (`repo`) | no, `repo` by default |
| `baseline-file-path` | Path to the beseline file created by detect-secrets (either local file system path or location within the repo) | no, `detect-secrets.json` by default |


## Action outputs

| Name | Description |
| --- | ---|
| `sarif-file-path` | Absolute path to the local sarif file created by this action |
| `issue-count` | Number of issues found by detect-secrets (and converted by this action) |




## Workflow examples

### Import a checked in detect-secrets baseline file

See an [import workflow example](../.github/workflows/import-detect-secrets-baseline-from-repo.yml) on this repo.


### Trigger a new detect-secrets scan directly from your browser

You can navigate to the Actions tab, select the `Run detect-secrets Baseline` workflow, click the _Run workflow_ button, and enter the required input fields.

![screenshot of triggering a new scan from the browser](https://user-images.githubusercontent.com/18272293/100273095-3a68a300-2f2a-11eb-82be-2308c5b7daca.png)

See a [run workflow example](https://github.com/pierre-ernst/github-actions/blob/main/.github/workflows/run-detect-secrets-baseline.yml) on this repo.


### Run detect-secrets as a PR check
To scan new or updated files that are committed via a Pull Request, you can build a workflow to make sure no new hard-coded secrets are being merged:

![screenshot of a failed PR check](https://user-images.githubusercontent.com/18272293/100274148-f1b1e980-2f2b-11eb-9afd-89dffab05ebc.png)

There are [examples of passed or failled PRs](../pulls) on this repo.

See a [PR check workflow example](../.github/workflows/pr-detect-secrets.yml) on this repo.


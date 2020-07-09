import * as core from "@actions/core";
import * as github from "@actions/github";

// this file has been edited

type Args = {
  repoToken: string;
};

async function run() {
  try {
    const args = getAndValidateArgs();
    const client = new github.GitHub(args.repoToken);
    const context = github.context;
    const pull_request = context.payload.pull_request;

    if (!pull_request) {
      throw new Error("Payload is missing pull_request.");
    }

    const incompleteTaskListItem = getIncompleteCount(pull_request.body || "");

    // const maxDescriptionExample =
    //   "012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";

    const maxDescriptionExample =
      "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
    await client.repos.createStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: pull_request.head.sha,
      state: incompleteTaskListItem === 0 ? "success" : "error",
      description: maxDescriptionExample,
      // description: incompleteTaskListItem === 0
      //   ? "Ready to merge"
      //   : `${incompleteTaskListItem} requirements to do (first line? and this is a really long one to see what happens. Adding more text here because it needs to be really really really long")`
      context: "Kaizen Contributor"
    });
    await client.repos.createStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: pull_request.head.sha,
      state: incompleteTaskListItem === 0 ? "success" : "error",
      description: maxDescriptionExample,
      // description: incompleteTaskListItem === 0
      //   ? "Ready to merge"
      //   : `${incompleteTaskListItem} requirements to do (second line? and this is a really long one to see what happens. Adding more text here because it needs to be really really really long")`,
      context: "Kaizen Contributor"
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}

function getAndValidateArgs(): Args {
  return {
    repoToken: core.getInput("repo-token", { required: true })
  };
}

function getIncompleteCount(pullRequestBody: string) {
  if (!pullRequestBody) {
    return 0;
  }
  const pullRequestBodyLines = pullRequestBody.match(/[^\r\n]+/g);
  if (pullRequestBodyLines === null) {
    return 0;
  }

  let incompleteCount = 0;
  for (const line of pullRequestBodyLines) {
    if (line.trim().startsWith("- [ ]")) {
      incompleteCount++;
    }
  }
  return incompleteCount;
}

run();

export function truncateDescriptionToMeetGithubRequirements(
  description: string
): string {
  const maxGithubCheckDescriptionLength = 140;
  return description.slice(0, maxGithubCheckDescriptionLength);
}

type ChecklistItem = { description: string; checked: boolean };

export function parseMarkdownChecklistItems(
  markdown: string
): Array<ChecklistItem> {
  const lines = markdown.split(/\r?\n/);
  return lines.map(parseMarkdownChecklistItem).filter(notNull);
}

function notNull<TValue>(value: TValue | null): value is TValue {
  return value !== null;
}

export function parseMarkdownChecklistItem(
  markdown: string
): (ChecklistItem | null) {
  const regex = /^\- \[( |x)\] (.*)/;
  const matches = regex.exec(markdown);
  if (matches) {
    return { description: matches[2].trim(), checked: matches[1] === "x" };
  } else {
    return null;
  }
}

export function filterByWhitelist(
  checklistItems: Array<ChecklistItem>,
  whitelist: string[]
): Array<ChecklistItem> {
  return checklistItems.filter(({ description }) =>
    whitelist.includes(description)
  );
}

type GithubCheckSpec = { description: string; success: boolean };
export function getGithubCheckSpecs(
  checklistItems: Array<ChecklistItem>
): Array<GithubCheckSpec> {
  const failedItems = checklistItems.filter(({ checked }) => !checked);
  if (failedItems.length >= 1) {
    return failedItems.map(({ description }) => ({
      description: truncateDescriptionToMeetGithubRequirements(description),
      success: false
    }));
  } else {
    return [{ description: "All tasks done", success: true }];
  }
}

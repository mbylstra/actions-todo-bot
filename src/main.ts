import * as core from "@actions/core";
import * as github from "@actions/github";

const whitelist = [
  "I have gotten a design review from someone else if this introduces user facing changes",
  "I have gotten someone else to QA this if the changes are significant",
  "I or someone else has QA'ed this in IE11 if it feels necessary"
];

async function run() {
  try {
    const args = getAndValidateArgs();
    const client = new github.GitHub(args.repoToken);
    const pullRequest = github.context.payload.pull_request;
    if (!pullRequest) {
      throw new Error("Payload is missing pull_request.");
    }
    const checklistItems = filterByWhitelist(
      parseMarkdownChecklistItems(pullRequest.body || ""),
      whitelist
    );
    const specs = getGithubCheckSpecs(checklistItems);
    let i = 1;
    for (const spec of specs) {
      const context = `Kaizen Contributor TODO (${i})`;
      await createStatus({ pullRequest, client, spec, context });
      i++;
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}
async function createStatus({ pullRequest, client, spec, context }) {
  return client.repos.createStatus({
    owner: github.context.issue.owner,
    repo: github.context.issue.repo,
    sha: pullRequest.head.sha,
    state: spec.success ? "success" : "error",
    description: spec.description,
    context: context
  });
}

type Args = {
  repoToken: string;
};

function getAndValidateArgs(): Args {
  return {
    repoToken: core.getInput("repo-token", { required: true })
  };
}

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

type GithubCheckSpec = { description: string; success: boolean; id: number };
export function getGithubCheckSpecs(
  checklistItems: Array<ChecklistItem>
): Array<GithubCheckSpec> {
  return checklistItems.map(({ description, checked }, index) => ({
    description: truncateDescriptionToMeetGithubRequirements(description),
    success: checked,
    id: index + 1
  }));

  // } else {
  // return [{ description: "All tasks done", success: true, id: 2 }];
  // }
}

run();

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

    const maxDescriptionExample =
      "012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";

    await client.repos.createStatus({
      owner: context.issue.owner,
      repo: context.issue.repo,
      sha: pull_request.head.sha,
      state: incompleteTaskListItem === 0 ? "success" : "error",
      description: maxDescriptionExample
      // description: incompleteTaskListItem === 0
      //   ? "Ready to merge"
      //   : `${incompleteTaskListItem} requirements to do (first line? and this is a really long one to see what happens. Adding more text here because it needs to be really really really long")`
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

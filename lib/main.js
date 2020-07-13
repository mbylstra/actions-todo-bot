"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
exports.whitelist = [
    "I have gotten a design review from someone else if this introduces user facing changes",
    "I have gotten someone else to QA this if the changes are significant",
    "I or someone else has QA'ed this in IE11 if it feels worth it"
];
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const args = getAndValidateArgs();
            const client = new github.GitHub(args.repoToken);
            const pullRequest = github.context.payload.pull_request;
            if (!pullRequest) {
                throw new Error("Payload is missing pull_request.");
            }
            const checklistItems = joinWithWhitelist(parseMarkdownChecklistItems(pullRequest.body || ""), exports.whitelist);
            const specs = getGithubStatusSpecs(checklistItems);
            let i = 1;
            for (const spec of specs) {
                const context = `Kaizen Contributor TODO (${i})`;
                yield createGithubStatus({ pullRequest, client, spec, context });
                i++;
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function createGithubStatus({ pullRequest, client, spec, context }) {
    return __awaiter(this, void 0, void 0, function* () {
        return client.repos.createStatus({
            owner: github.context.issue.owner,
            repo: github.context.issue.repo,
            sha: pullRequest.head.sha,
            state: spec.success ? "success" : "error",
            description: spec.description,
            context: context
        });
    });
}
function getAndValidateArgs() {
    return {
        repoToken: core.getInput("repo-token", { required: true })
    };
}
function truncateDescriptionToMeetGithubRequirements(description) {
    const maxGithubCheckDescriptionLength = 140;
    return description.slice(0, maxGithubCheckDescriptionLength);
}
exports.truncateDescriptionToMeetGithubRequirements = truncateDescriptionToMeetGithubRequirements;
function parseMarkdownChecklistItems(markdown) {
    const lines = markdown.split(/\r?\n/);
    return lines.map(parseMarkdownChecklistItem).filter(notNull);
}
exports.parseMarkdownChecklistItems = parseMarkdownChecklistItems;
function notNull(value) {
    return value !== null;
}
function parseMarkdownChecklistItem(markdown) {
    const regex = /^\- \[( |x)\] (.*)/;
    const matches = regex.exec(markdown);
    if (matches) {
        return { description: matches[2].trim(), checked: matches[1] === "x" };
    }
    else {
        return null;
    }
}
exports.parseMarkdownChecklistItem = parseMarkdownChecklistItem;
function joinWithWhitelist(checklistItems, whitelist) {
    return whitelist.map(whitelistDescription => {
        const checklistItem = findChecklistItem(checklistItems, whitelistDescription);
        if (checklistItem != null) {
            return checklistItem;
        }
        else {
            /* Missing whitelist checkbox items are always set to true. This is to avoid an
             * edge case where it would be impossible to merge the PR: if the PR initially
             * has unchecked checkboxes, and then they are deleted from the description, there
             * will be no way to set the already generated Github Status to success. Setting
             * deleted checklist items to success will make the PR mergeable*/
            return { description: whitelistDescription, checked: true };
        }
    });
}
exports.joinWithWhitelist = joinWithWhitelist;
function findChecklistItem(checklistItems, description) {
    return checklistItems.find(item => {
        return item.description.trim().startsWith(description.trim());
    });
}
exports.findChecklistItem = findChecklistItem;
function getGithubStatusSpecs(checklistItems) {
    return checklistItems.map(({ description, checked }, index) => ({
        description: truncateDescriptionToMeetGithubRequirements(description),
        success: checked,
        id: index + 1
    }));
}
exports.getGithubStatusSpecs = getGithubStatusSpecs;
run();

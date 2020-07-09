import {
  truncateDescriptionToMeetGithubRequirements,
  parseMarkdownChecklistItems,
  parseMarkdownChecklistItem,
  filterByWhitelist,
  getGithubCheckSpecs
} from "../src/main";

describe("parseMarkdownChecklistItems", () => {
  it("correctly parses markdown for checklist items", async () => {
    const markdown = [
      "- [ ] unchecked checklist item 1",
      "- [x] checked checklist item 2",
      "not a checklist item"
    ].join("\n");
    expect(parseMarkdownChecklistItems(markdown)).toEqual([
      {
        description: "unchecked checklist item 1",
        checked: false
      },
      {
        description: "checked checklist item 2",
        checked: true
      }
    ]);
  });
});

describe("parseMarkdownChecklistItem", () => {
  it("correctly parses an unchecked item", async () => {
    const markdown = "- [ ] unchecked checklist item 1";
    expect(parseMarkdownChecklistItem(markdown)).toMatchObject({
      description: "unchecked checklist item 1",
      checked: false
    });
  });
  it("correctly parses a checked item", async () => {
    const markdown = "- [x] checked checklist item 1";
    expect(parseMarkdownChecklistItem(markdown)).toMatchObject({
      description: "checked checklist item 1",
      checked: true
    });
  });
  it("returns null if not a checklist item", async () => {
    const markdown = "-[x] not actually a checklist item";
    expect(parseMarkdownChecklistItem(markdown)).toBeNull();
  });
});

describe("truncateDescriptionToMeetGithubRequirements", () => {
  it("truncates the string to less than 140 characters", async () => {
    const testString = "x".repeat(300);
    expect(
      truncateDescriptionToMeetGithubRequirements(testString).length
    ).toBeLessThanOrEqual(140);
  });
});

describe("filterByWhitelist", () => {
  it("keeps only wanted wanted items", async () => {
    const whitelist = ["keep me", "keep me too ignoring whitespace"];
    const markdown = [
      "- [ ] keep me",
      "- [x]     keep me too ignoring whitespace      ",
      "- [ ] ignore me"
    ].join("\n");
    const checklistItems = parseMarkdownChecklistItems(markdown);
    expect(filterByWhitelist(checklistItems, whitelist)).toEqual([
      {
        description: "keep me",
        checked: false
      },
      {
        description: "keep me too ignoring whitespace",
        checked: true
      }
    ]);
  });
});

describe("getGithubCheckSpecs", () => {
  it("returns a single success spec if all checklist items are checked", async () => {
    const checklistItems = [
      { description: "item 1", checked: true },
      { description: "item 2", checked: true }
    ];
    expect(getGithubCheckSpecs(checklistItems)).toEqual([
      {
        description: "All tasks done",
        success: true
      }
    ]);
  });
  it("returns one failed spec for each unchecked item", async () => {
    const checklistItems = [
      { description: "item 1", checked: true },
      { description: "item 2", checked: false },
      { description: "item 3", checked: false }
    ];
    expect(getGithubCheckSpecs(checklistItems)).toEqual([
      {
        description: "item 2",
        success: false
      },
      {
        description: "item 3",
        success: false
      }
    ]);
  });
});

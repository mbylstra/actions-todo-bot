import { truncateDescriptionToMeetGithubRequirements } from "../src/main";

describe("truncateDescriptionToMeetGithubRequirements", () => {
  it("truncates the string to less than 140 characters", async () => {
    const testString = "x".repeat(300);
    expect(
      truncateDescriptionToMeetGithubRequirements(testString).length
    ).toBeLessThanOrEqual(140);
  });
});

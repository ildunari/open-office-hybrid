import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import ResumeTaskBannerHarness from "./fixtures/resume-task-banner-harness.svelte";

describe("ResumeTaskBanner", () => {
  it("hides the resume button when resume is not allowed", () => {
    const { body } = render(ResumeTaskBannerHarness, {
      props: {
        message: "Task is waiting on verification follow-up.",
        canResume: false,
        chat: { resumeFromHandoff: () => undefined },
      },
    });

    expect(body).toContain(
      "Task is waiting on verification follow-up.",
    );
    expect(body).not.toContain("Resume task");
  });

  it("renders the resume action when resume is allowed", () => {
    const { body } = render(ResumeTaskBannerHarness, {
      props: {
        message: "Resume after addressing the retryable mismatch.",
        canResume: true,
        chat: { resumeFromHandoff: () => undefined },
      },
    });

    expect(body).toContain("Resume task");
  });
});

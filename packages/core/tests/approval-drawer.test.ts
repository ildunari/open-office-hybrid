import type { ApprovalRequest } from "@office-agents/sdk";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import ApprovalDrawerHarness from "./fixtures/approval-drawer-harness.svelte";

function makeApproval(overrides: Partial<ApprovalRequest> = {}): ApprovalRequest {
  return {
    level: "high",
    destructive: true,
    reason: "Need approval before changing the document",
    actionClass: "destructive_write",
    scopes: [{ kind: "document", ref: "doc-1" }],
    requestedAt: 123,
    ...overrides,
  };
}

describe("ApprovalDrawer", () => {
  it("renders read-only guidance instead of an approve button", async () => {
    const { body } = render(ApprovalDrawerHarness, {
      props: {
        approval: makeApproval(),
        permissionMode: "read_only",
        chat: { approvePending: () => undefined },
      },
    });

    expect(body).toContain("approval needed");
    expect(body).toContain(
      "Change permission mode to continue.",
    );
    expect(body).toContain("action: destructive_write");
    expect(body).toContain("scope: doc-1");
    expect(body).not.toContain("Approve and continue");
  });

  it("renders the approval CTA for writable modes and falls back to unknown action labels", () => {
    const { body } = render(ApprovalDrawerHarness, {
      props: {
        approval: makeApproval({ actionClass: undefined }),
        permissionMode: "confirm_risky",
        chat: { approvePending: () => undefined },
      },
    });

    expect(body).toContain("Approve and continue");
    expect(body).not.toContain("action:");
  });
});

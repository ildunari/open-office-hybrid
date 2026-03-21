import { describe, expect, it, vi } from "vitest";
import { bindOfficeDocumentHandler } from "../src/lib/components/office-document-events";

describe("bindOfficeDocumentHandler", () => {
  it("registers and removes the same Office document handler", () => {
    const addHandlerAsync = vi.fn();
    const removeHandlerAsync = vi.fn();
    const officeDocument = {
      addHandlerAsync,
      removeHandlerAsync,
    };
    const handler = vi.fn();

    const detach = bindOfficeDocumentHandler(
      officeDocument,
      "DocumentSelectionChanged",
      handler,
    );

    expect(addHandlerAsync).toHaveBeenCalledWith(
      "DocumentSelectionChanged",
      handler,
      expect.any(Function),
    );

    detach();

    expect(removeHandlerAsync).toHaveBeenCalledWith(
      "DocumentSelectionChanged",
      { handler },
      expect.any(Function),
    );
  });

  it("is safe when the Office document is unavailable", () => {
    const detach = bindOfficeDocumentHandler(
      undefined,
      "DocumentSelectionChanged",
      vi.fn(),
    );

    expect(() => detach()).not.toThrow();
  });
});

interface OfficeDocumentEventSource {
  addHandlerAsync: (
    eventType: unknown,
    handler: (...args: unknown[]) => void,
    callback?: (...args: unknown[]) => void,
  ) => void;
  removeHandlerAsync?: (
    eventType: unknown,
    options: { handler: (...args: unknown[]) => void },
    callback?: (...args: unknown[]) => void,
  ) => void;
}

export function bindOfficeDocumentHandler(
  officeDocument: OfficeDocumentEventSource | null | undefined,
  eventType: unknown,
  handler: (...args: unknown[]) => void,
): () => void {
  if (!officeDocument) return () => undefined;

  try {
    officeDocument.addHandlerAsync(eventType, handler, () => undefined);
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      officeDocument.removeHandlerAsync?.(
        eventType,
        { handler },
        () => undefined,
      );
    } catch {
      // Ignore teardown failures so component destroy stays safe.
    }
  };
}

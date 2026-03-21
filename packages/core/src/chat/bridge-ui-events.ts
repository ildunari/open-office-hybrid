import type {
  BridgeEventName,
  BridgeEventPayloads,
  OfficeBridgeController,
} from "@office-agents/bridge";

let bridgeController: OfficeBridgeController | null = null;

export function setBridgeController(
  controller: OfficeBridgeController | null,
): void {
  bridgeController = controller;
}

export function emitBridgeUIEvent<K extends BridgeEventName>(
  event: K,
  payload: BridgeEventPayloads[K],
): void {
  if (!bridgeController?.enabled) return;
  bridgeController.emitEvent(event, payload);
}

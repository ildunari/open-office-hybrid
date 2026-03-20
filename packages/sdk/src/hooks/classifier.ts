import type { RiskLevel, ToolTag } from "./types";

const TOOL_CLASSIFICATIONS: Record<
  string,
  { tags: ToolTag[]; risk: RiskLevel }
> = {
  read: { tags: ["read", "fs"], risk: "none" },
  bash: { tags: ["write", "shell"], risk: "medium" },

  screenshot_document: { tags: ["read"], risk: "none" },
  get_document_text: { tags: ["read"], risk: "none" },
  get_document_structure: { tags: ["read"], risk: "none" },
  get_ooxml: { tags: ["read"], risk: "none" },
  get_paragraph_ooxml: { tags: ["read"], risk: "none" },
  execute_office_js: { tags: ["write", "office-js"], risk: "high" },

  get_cell_ranges: { tags: ["read"], risk: "none" },
  get_range_as_csv: { tags: ["read"], risk: "none" },
  search_data: { tags: ["read"], risk: "none" },
  screenshot_range: { tags: ["read"], risk: "none" },
  get_all_objects: { tags: ["read"], risk: "none" },
  set_cell_range: { tags: ["write"], risk: "medium" },
  clear_cell_range: { tags: ["write", "destructive"], risk: "high" },
  copy_to: { tags: ["write"], risk: "low" },
  modify_sheet_structure: { tags: ["write"], risk: "medium" },
  modify_workbook_structure: { tags: ["write"], risk: "medium" },
  resize_range: { tags: ["write"], risk: "low" },
  modify_object: { tags: ["write"], risk: "medium" },
  eval_officejs: { tags: ["write", "office-js"], risk: "high" },

  read_slide_text: { tags: ["read"], risk: "none" },
  list_slide_shapes: { tags: ["read"], risk: "none" },
  screenshot_slide: { tags: ["read"], risk: "none" },
  verify_slides: { tags: ["read"], risk: "none" },
  edit_slide_text: { tags: ["write"], risk: "medium" },
  edit_slide_xml: { tags: ["write"], risk: "high" },
  edit_slide_chart: { tags: ["write"], risk: "medium" },
  edit_slide_master: { tags: ["write"], risk: "high" },
  duplicate_slide: { tags: ["write"], risk: "low" },
};

const DEFAULT_CLASSIFICATION = {
  tags: ["read"] as ToolTag[],
  risk: "none" as RiskLevel,
};

export function classifyTool(name: string): ToolTag[] {
  return [...(TOOL_CLASSIFICATIONS[name] ?? DEFAULT_CLASSIFICATION).tags];
}

export function classifyToolRisk(name: string): RiskLevel {
  return (TOOL_CLASSIFICATIONS[name] ?? DEFAULT_CLASSIFICATION).risk;
}

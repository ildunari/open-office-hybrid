import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface CorpusManifest {
  version: number;
  files: Array<{
    name: string;
    source_repo: string;
    license: string;
    source_url: string;
    sha256: string;
    features: string[];
  }>;
}

interface CorpusScenarios {
  version: number;
  liveSubset: string[];
  scenarios: Array<{
    file: string;
    stressArea: string;
    headlessOwners: string[];
    liveRole: string;
    request: string;
  }>;
}

const corpusDir = path.join(
  __dirname,
  "fixtures",
  "docx-corpus",
);

const manifestPath = path.join(corpusDir, "docx-corpus.manifest.json");
const scenariosPath = path.join(corpusDir, "docx-corpus.scenarios.json");
const manifest = JSON.parse(
  readFileSync(manifestPath, "utf8"),
) as CorpusManifest;
const scenarios = JSON.parse(
  readFileSync(scenariosPath, "utf8"),
) as CorpusScenarios;

describe("docx corpus", () => {
  it("tracks a balanced set of trusted open-source DOCX fixtures", () => {
    expect(manifest.version).toBe(1);
    expect(manifest.files).toHaveLength(10);
    expect(
      manifest.files.map((file) => file.name).sort(),
    ).toEqual([
      "Headers.docx",
      "blk-inner-content.docx",
      "comments.docx",
      "footnotes.docx",
      "having-images.docx",
      "simple-list.docx",
      "strict-format.docx",
      "tables.docx",
      "text-box.docx",
      "toc.docx",
    ]);
  });

  it("keeps hashes aligned with the downloaded fixtures", () => {
    for (const file of manifest.files) {
      const bytes = readFileSync(path.join(corpusDir, file.name));
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      expect(sha256).toBe(file.sha256);
    }
  });

  it("records useful feature coverage for each fixture", () => {
    for (const file of manifest.files) {
      expect(file.source_url).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
      expect(file.features.length).toBeGreaterThan(0);
      expect(file.name.endsWith(".docx")).toBe(true);
    }
  });

  it("defines a scenario map for each corpus file and a curated live subset", () => {
    expect(scenarios.version).toBe(1);
    expect(scenarios.scenarios).toHaveLength(manifest.files.length);
    expect(new Set(scenarios.scenarios.map((scenario) => scenario.file)).size).toBe(
      manifest.files.length,
    );
    expect(scenarios.liveSubset).toHaveLength(4);
    expect(scenarios.liveSubset.sort()).toEqual([
      "Headers.docx",
      "comments.docx",
      "having-images.docx",
      "strict-format.docx",
    ]);
  });

  it("covers review, formatting, structure, and media stress areas", () => {
    const stressAreas = new Set(
      scenarios.scenarios.map((scenario) => scenario.stressArea),
    );
    expect(stressAreas.has("review-heavy")).toBe(true);
    expect(stressAreas.has("formatting-heavy")).toBe(true);
    expect(stressAreas.has("structure-heavy")).toBe(true);
    expect(stressAreas.has("media-heavy")).toBe(true);
  });
});

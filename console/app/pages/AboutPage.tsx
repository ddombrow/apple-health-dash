import {
  AsciiDocBlocks,
  handleDocument,
  loadAsciidoctor,
} from "@oxide/design-system/asciidoc";
import { Asciidoc, type Options } from "@oxide/react-asciidoc";
import { useEffect, useState } from "react";

import type { DocumentBlock } from "@oxide/react-asciidoc";

const asciidoctor = loadAsciidoctor({ extensions: [] });

const opts: Options = {
  overrides: {
    admonition: AsciiDocBlocks.Admonition,
    table: AsciiDocBlocks.Table,
    section: AsciiDocBlocks.Section,
  },
};

const SAMPLE_DOC = `
= AHealth Console

Welcome to the AHealth Console. This page is rendered from AsciiDoc.

== Getting Started

AsciiDoc supports rich text formatting including *bold*, _italic_, and \`monospace\`.

== Features

* Real-time health monitoring
* Alerting and notifications
* Historical data analysis

NOTE: This is a sample admonition block rendered by the Oxide design system.

== Data Table

[cols="1,1,1"]
|===
| Metric | Value | Status

| CPU Usage
| 42%
| Healthy

| Memory
| 6.2 GB
| Healthy

| Disk I/O
| 120 MB/s
| Warning
|===
`;

export function AboutPage() {
  const [doc, setDoc] = useState<DocumentBlock | null>(null);

  useEffect(() => {
    const parsed = asciidoctor.load(SAMPLE_DOC);
    handleDocument(parsed).then(setDoc);
  }, []);

  if (!doc) return null;

  return (
    <main className="mx-auto max-w-3xl p-12">
      <div className="asciidoc-body">
        <Asciidoc document={doc} options={opts} />
      </div>
    </main>
  );
}

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
= About AHealth Console

AHealth Console is the dashboard frontend for a self-hosted Apple Health analytics project.
It pulls health data that has been collected from Apple Health, ingested into ClickHouse, and exposed through a small HTTP API for visualization.

== What This Project Does

The goal of the project is to make personal Apple Health data easier to explore over time.
Instead of keeping everything locked inside the Apple Health app, this stack turns the data into something you can query, chart, and build custom widgets around.

Today the console is focused on:

* Walking and running distance summaries
* Current-week activity views
* Progress tracking against longer-term mileage goals

== How The Data Flows

The broader project has a simple pipeline:

. Apple Health data is exported or published into the system
. An ingest service writes normalized metrics into ClickHouse
. The API queries that data and returns JSON responses
. This console turns those responses into dashboard widgets

NOTE: This app is intentionally personal and dashboard-oriented. It is meant to answer questions like "How much have I walked this week?" or "How far am I from a mileage goal?" quickly.

== Main Components

[cols="1,2"]
|===
| Component | Responsibility

| \`ahealth-ingest\`
| Collects Apple Health metric data and stores it in ClickHouse

| \`ahealth-api\`
| Exposes HTTP endpoints for dashboard-friendly metric queries

| \`ahealth-console\`
| Serves the frontend and renders the dashboard UI
|===

== Why It Exists

This project exists to make health data feel more like a personal analytics system than a closed app.
The console is where that becomes visible: custom widgets, week-based summaries, and views tailored to the questions that matter day to day.
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

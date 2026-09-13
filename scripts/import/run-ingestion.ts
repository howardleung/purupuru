import { prisma } from "../../packages/database/src/index.ts";

import { fixtureNames, loadFixture, type FixtureName } from "./adapters.ts";
import { ingestNormalizedListing, type IngestionResult } from "./ingestion-service.ts";
import { PrismaIngestionRepository } from "./prisma-ingestion-repository.ts";

function usage() {
  return [
    "Usage: pnpm ingest --fixture <well-round-lab|shiseido-anessa|all> [--dry-run|--execute]",
    "",
    "Dry-run is the safe default. --execute writes matched offers and observations.",
  ].join("\n");
}

function parseArgs(args: string[]) {
  if (args.includes("--help")) return { help: true, dryRun: true, fixtures: [] as FixtureName[] };
  const fixtureIndex = args.indexOf("--fixture");
  if (fixtureIndex < 0 || !args[fixtureIndex + 1]) throw new Error("--fixture is required");
  if (args.includes("--dry-run") && args.includes("--execute")) {
    throw new Error("Choose either --dry-run or --execute, not both");
  }
  const selected = args[fixtureIndex + 1]!;
  const fixtures = selected === "all"
    ? [...fixtureNames]
    : fixtureNames.includes(selected as FixtureName)
      ? [selected as FixtureName]
      : [];
  if (fixtures.length === 0) throw new Error(`Unknown fixture: ${selected}`);
  return { help: false, dryRun: !args.includes("--execute"), fixtures };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const results: IngestionResult[] = [];
  for (const fixture of options.fixtures) {
    try {
      const record = await loadFixture(fixture);
      const result = await prisma.$transaction(
        (transaction) =>
          ingestNormalizedListing(new PrismaIngestionRepository(transaction), record, {
            dryRun: options.dryRun,
          }),
        { isolationLevel: "Serializable" },
      );
      results.push(result);
    } catch (error) {
      results.push({
        sourceKey: fixture,
        externalListingId: null,
        sourceUrl: "",
        dryRun: options.dryRun,
        status: "rejected",
        match: { status: "rejected", variantId: null, evidence: [], reason: "Adapter or database error" },
        offer: { action: "none", offerId: null, changes: [] },
        observation: { action: "none", observationId: null },
        errors: [error instanceof Error ? error.message : "Unknown ingestion error"],
      });
    }
  }

  console.log(JSON.stringify({ mode: options.dryRun ? "dry-run" : "execute", results }, null, 2));
  if (results.some((result) => result.status === "rejected")) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    console.error(usage());
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
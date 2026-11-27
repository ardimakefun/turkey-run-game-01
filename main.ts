import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const PROJECT_ROOT = dirname(fileURLToPath(import.meta.url));
const MAX_DOSSIER_BYTES = 1572864;
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function resolveDestination(): string {
  return process.env.MAKEFUN_OUTPUT_DIR || "/output";
}

function stageSubmissionFolder(sourceRoot: string, destinationRoot: string): void {
  const gameSource = join(sourceRoot, "game");
  const entryHtml = join(gameSource, "index.html");
  if (!existsSync(entryHtml)) {
    throw new Error(`Missing required game entrypoint at ${entryHtml}`);
  }

  mkdirSync(destinationRoot, { recursive: true });

  const targetGame = join(destinationRoot, "game");
  const targetShots = join(destinationRoot, "screenshots");
  rmSync(targetGame, { recursive: true, force: true });
  rmSync(targetShots, { recursive: true, force: true });

  cpSync(gameSource, targetGame, { recursive: true });
  mkdirSync(targetShots, { recursive: true });

  const shotsSource = join(sourceRoot, "screenshots");
  if (existsSync(shotsSource)) {
    cpSync(shotsSource, targetShots, { recursive: true });
  }
}

function verifyOutputBundle(destinationRoot: string, dossierPath: string): void {
  const shotsDir = join(destinationRoot, "screenshots");
  const shotFiles = readdirSync(shotsDir).filter((name) => !name.startsWith("."));
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    throw new Error(`Expected 3 to 4 screenshots in ${shotsDir}, found ${shotFiles.length}`);
  }

  const dossierSize = statSync(dossierPath).size;
  if (dossierSize > MAX_DOSSIER_BYTES) {
    throw new Error(`Generated dossier.json exceeds 1.5 MiB limit (${dossierSize} bytes)`);
  }
}

function packageTurkeyRun(): void {
  const destinationRoot = resolveDestination();
  stageSubmissionFolder(PROJECT_ROOT, destinationRoot);

  const dossierPath = join(destinationRoot, "dossier.json");
  const dossierJson = buildDossier(destinationRoot, DOSSIER_LIMITS);
  writeFileSync(dossierPath, dossierJson);

  verifyOutputBundle(destinationRoot, dossierPath);
}

packageTurkeyRun();

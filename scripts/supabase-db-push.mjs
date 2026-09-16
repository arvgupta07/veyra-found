#!/usr/bin/env node
/**
 * Run `supabase db push` without SUPABASE_PROJECT_ID breaking the CLI.
 * That env var (often copied from .env as YOUR-PROJECT-ID) overrides the
 * linked project and triggers "Invalid project ref format" on db push.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const configPath = join(root, "supabase", "config.toml");
const projectRefPath = join(root, "supabase", ".temp", "project-ref");

delete process.env.SUPABASE_PROJECT_ID;
delete process.env.VITE_SUPABASE_PROJECT_ID;

let projectRef = "lyqkzunsqworhvwphsia";

if (existsSync(configPath)) {
  const match = readFileSync(configPath, "utf8").match(/project_id\s*=\s*"([a-z]{20})"/);
  if (match) projectRef = match[1];
}

if (!existsSync(projectRefPath)) {
  mkdirSync(join(root, "supabase", ".temp"), { recursive: true });
  writeFileSync(projectRefPath, projectRef, "utf8");
  console.log(`Wrote supabase/.temp/project-ref → ${projectRef}`);
}

const result = spawnSync("npx", ["supabase", "db", "push", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);

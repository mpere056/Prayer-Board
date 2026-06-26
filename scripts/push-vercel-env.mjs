import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const filePath = ".env.local";
const environments = ["production", "preview", "development"];

function parseEnvFile(source) {
  const values = new Map();

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value.replaceAll("\\n", "\n"));
  }

  return values;
}

function runVercel(args, input) {
  const result = spawnSync("vercel", args, {
    input,
    encoding: "utf8",
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function valueForVercel(value) {
  return value.endsWith("\n") ? value.trimEnd() : value;
}

if (!existsSync(filePath)) {
  console.error(`${filePath} does not exist. Copy .env.example to .env.local and fill it in first.`);
  process.exit(1);
}

const values = parseEnvFile(readFileSync(filePath, "utf8"));
if (values.size === 0) {
  console.error(`${filePath} does not contain any environment variables.`);
  process.exit(1);
}

for (const [key, value] of values) {
  const rawVercelValue = key === "NEXT_PUBLIC_SITE_URL" && process.env.VERCEL_SITE_URL
    ? process.env.VERCEL_SITE_URL
    : value;
  const vercelValue = valueForVercel(rawVercelValue);

  if (!vercelValue || vercelValue.startsWith("your-") || vercelValue.startsWith("generate-") || vercelValue.startsWith("TODO_")) {
    console.log(`Skipping ${key}: placeholder or empty value.`);
    continue;
  }

  for (const environment of environments) {
    const add = runVercel(["env", "add", key, environment], vercelValue);
    if (add.ok) {
      console.log(`Added ${key} to ${environment}.`);
      continue;
    }

    if (!/already (exists|been added)/i.test(add.output)) {
      console.error(`Failed to add ${key} to ${environment}.`);
      console.error(add.output);
      process.exit(1);
    }

    const update = runVercel(["env", "update", key, environment], vercelValue);
    if (!update.ok) {
      console.error(`Failed to update ${key} in ${environment}.`);
      console.error(update.output);
      process.exit(1);
    }
    console.log(`Updated ${key} in ${environment}.`);
  }
}

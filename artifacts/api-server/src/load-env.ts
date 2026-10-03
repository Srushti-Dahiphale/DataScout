import { existsSync } from "node:fs";
for (const p of [".env", "../../.env", "../../../.env"]) {
  if (existsSync(p)) { try { process.loadEnvFile(p); } catch {} break; }
}
export {};

import { ensureMasterSchema } from "./master-schema-sync";

/**
 * Ensures all staff, governance, and organizational schema exist.
 * Delegated to master-schema-sync for unified, self-healing execution.
 */
export async function ensureStaffSchema(force = false): Promise<void> {
  await ensureMasterSchema(force);
}

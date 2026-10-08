"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminAccess } from "../../../lib/admin-auth";
import { commitProductImport, rejectProductImport } from "../../../lib/admin/product-import-service";
import { RateLimitError } from "../../../lib/rate-limit";

function validId(value: string) {
  return value.length >= 8 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);
}

function handleActionError(error: unknown, batchId: string): never {
  if (error instanceof RateLimitError) redirect(`/admin/imports/${batchId}?notice=rate-limited`);
  throw error;
}

export async function commitImportAction(batchId: string) {
  if (!validId(batchId)) return;
  try {
    const access = await getAdminAccess({ mutation: true });
    if (access.status !== "AUTHORIZED") return;
    await commitProductImport(batchId, access.clerkUserId);
  } catch (error) {
    handleActionError(error, batchId);
  }
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
  revalidatePath("/catalogue");
}

export async function rejectImportAction(batchId: string) {
  if (!validId(batchId)) return;
  try {
    const access = await getAdminAccess({ mutation: true });
    if (access.status !== "AUTHORIZED") return;
    await rejectProductImport(batchId, access.clerkUserId);
  } catch (error) {
    handleActionError(error, batchId);
  }
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
}

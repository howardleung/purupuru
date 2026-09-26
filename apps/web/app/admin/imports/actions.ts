"use server";

import { revalidatePath } from "next/cache";

import { getAdminAccess } from "../../../lib/admin-auth";
import { commitProductImport, rejectProductImport } from "../../../lib/admin/product-import-service";

function validId(value: string) {
  return value.length >= 8 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);
}

export async function commitImportAction(batchId: string) {
  if (!validId(batchId)) return;
  const access = await getAdminAccess({ mutation: true });
  if (access.status !== "AUTHORIZED") return;
  await commitProductImport(batchId, access.clerkUserId);
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
  revalidatePath("/catalogue");
}

export async function rejectImportAction(batchId: string) {
  if (!validId(batchId)) return;
  const access = await getAdminAccess({ mutation: true });
  if (access.status !== "AUTHORIZED") return;
  await rejectProductImport(batchId, access.clerkUserId);
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
}

"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { commitImportAction, rejectImportAction } from "../actions";

function ImportBatchButtons({
  canCommit,
  commitAction,
  rejectAction,
}: {
  canCommit: boolean;
  commitAction: () => Promise<void>;
  rejectAction: () => Promise<void>;
}) {
  const { action, pending } = useFormStatus();
  const committing = pending && action === commitAction;
  const rejecting = pending && action === rejectAction;

  return <>
    {canCommit ? <button className="ui-button ui-button--primary" disabled={pending} formAction={commitAction} type="submit">
      {committing ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
      <span>{committing ? "Committing…" : "Approve and commit batch"}</span>
    </button> : null}
    <button className="ui-button ui-button--ghost" disabled={pending} formAction={rejectAction} type="submit">
      {rejecting ? "Rejecting…" : "Reject"}
    </button>
  </>;
}

export function ImportBatchActions({ batchId, canCommit }: { batchId: string; canCommit: boolean }) {
  const commitAction = commitImportAction.bind(null, batchId);
  const rejectAction = rejectImportAction.bind(null, batchId);

  return <form className="flex gap-2">
    <ImportBatchButtons canCommit={canCommit} commitAction={commitAction} rejectAction={rejectAction} />
  </form>;
}

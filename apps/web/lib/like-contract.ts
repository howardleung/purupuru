export type LikeResult = {
  status: "SUCCESS" | "UNAUTHENTICATED" | "INVALID" | "ERROR";
  message: string;
  productVersionId?: string;
  liked?: boolean;
};

export type LikeReadResult =
  | { status: "SUCCESS"; userId: string; versionIds: string[] }
  | { status: "ERROR" | "UNAUTHENTICATED"; message: string };

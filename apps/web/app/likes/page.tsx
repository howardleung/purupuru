import type { Metadata } from "next";
import Link from "next/link";

import { CollectionSignIn } from "../../components/collection-sign-in";
import { ProductCard } from "../../components/product-card";
import { LikeButton, RetryLikesButton } from "../../components/like-button";
import { isClerkConfigured } from "../../lib/clerk-config";
import { getOrCreateCurrentUser } from "../../lib/current-user";
import { getLikedProductsForUser } from "../../lib/likes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Liked Products" };

export default async function LikedProductsPage() {
  let user: Awaited<ReturnType<typeof getOrCreateCurrentUser>> = null;
  let data: Awaited<ReturnType<typeof getLikedProductsForUser>> = { products: [], unavailable: [] };
  let loadFailed = false;
  try {
    user = isClerkConfigured ? await getOrCreateCurrentUser() : null;
    if (user) data = await getLikedProductsForUser(user.id);
  } catch (error) {
    console.error("Unable to display Liked Products", error);
    loadFailed = true;
  }
  const { products, unavailable } = data;
  return <main className="page-container py-8 sm:py-12">
    <h1 className="text-3xl font-bold">Liked Products</h1>
    <p className="mt-3 text-slate-600">Products you like or want to explore. A Like means interest, not ownership, experience, or a recommendation.</p>
    {!isClerkConfigured ? <p className="mt-6 text-sm">Account features are unavailable. You can continue browsing.</p>
      : loadFailed ? <section className="empty-state mt-6" role="alert"><p>Your liked products could not be loaded. Please retry.</p><RetryLikesButton /></section>
      : !user ? <CollectionSignIn />
      : products.length > 0 || unavailable.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => <div key={product.currentVersion?.id ?? product.id}>
          <ProductCard product={product} />
          {product.currentVersion?.showVersionName ? <p className="mt-2 text-xs text-slate-500">Saved formula · {product.currentVersion.versionName}</p> : null}
        </div>)}
        {unavailable.map((like) => <section className="surface-card p-4" key={like.productVersionId}>
          <LikeButton productSlug={like.productVersion.productFamily.slug} productVersionId={like.productVersionId} />
          <p className="mt-3 text-xs text-slate-500">{like.productVersion.productFamily.brand.name}</p>
          <h2 className="mt-1 font-bold">{like.productVersion.productFamily.canonicalName}</h2>
          <p className="mt-2 text-xs text-slate-500">Saved formula · {like.productVersion.versionName}</p>
          <p className="mt-3 text-sm">No active sizes are currently tracked for this saved version. You can still remove its Like.</p>
        </section>)}
      </div> : <section className="empty-state mt-6"><h2 className="font-bold">No liked products yet</h2><p className="mt-2">Tap a heart while browsing to save a product here.</p><Link className="ui-link mt-4" href="/catalogue">Browse skincare</Link></section>}
    {user ? <p className="mt-8 text-sm"><Link className="ui-link" href="/collection/legacy">Previous collection and purchase history</Link></p> : null}
  </main>;
}

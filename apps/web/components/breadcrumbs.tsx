import Link from "next/link";

type BreadcrumbItem = {
  id: string;
  slug: string;
  displayName: string;
};

export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li className="flex items-center gap-2" key={item.id}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            <Link className="hover:text-slate-950 hover:underline" href={"/categories/" + item.slug}>
              {item.displayName}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

import { CATEGORY_LABELS, type Category } from "@/lib/schema";

export default function CategoryBadge({ category }: { category: Category }) {
    return (
        <span className="rounded border border-itcc-blue-700 bg-itcc-blue-500 px-2 py-0.75 font-pixel text-xs tracking-[1px] text-white uppercase">
            {CATEGORY_LABELS[category]}
        </span>
    );
}

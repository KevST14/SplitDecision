import { useEffect, useState } from "react";
import { api, Category } from "../api";

const FALLBACK: Category[] = [{ id: "trending", label: "Trending", tag_id: null }];

export function CategoryChips({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const [categories, setCategories] = useState<Category[]>(FALLBACK);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="category-chips">
      {categories.map((c) => (
        <button
          key={c.id}
          className={`category-chip ${active === c.id ? "category-chip-active" : ""}`}
          onClick={() => onChange(c.id)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  field: string;
  onFieldChange: (v: string) => void;
  sortOrder: "asc" | "desc";
  onSortToggle: () => void;
};

const selectCls =
  "h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue appearance-none cursor-pointer pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 fill=%22none%22 viewBox=%220 0 24 24%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.6rem_center]";

export default function FilterBar({
  search,
  onSearchChange,
  field,
  onFieldChange,
  sortOrder,
  onSortToggle,
}: Omit<Props, "author" | "onAuthorChange"> & { author?: string; onAuthorChange?: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Wyszukiwarka */}
      <div className="relative flex-1 min-w-[180px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <Input
          placeholder="Szukaj..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 rounded-xl border-gray-200"
          style={{ backgroundColor: "#ffffff" }}
        />
      </div>

      {/* Dziedzina */}
      <select
        value={field}
        onChange={(e) => onFieldChange(e.target.value)}
        className={selectCls + " w-44"}
      >
        <option value="all">Wszystkie dziedziny</option>
        <option value="Endokrynologia">Endokrynologia</option>
        <option value="Stomatologia">Stomatologia</option>
        <option value="Fizjoterapia">Fizjoterapia</option>
      </select>

      {/* Sortowanie */}
      <Button
        variant="outline"
        onClick={onSortToggle}
        className="flex items-center gap-2 rounded-xl border-gray-200"
        style={{ backgroundColor: "#ffffff" }}
      >
        <ArrowUpDown size={14} />
        {sortOrder === "desc" ? "Najnowsze" : "Najstarsze"}
      </Button>
    </div>
  );
}

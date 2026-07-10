"use client";

import { useCategoriesContext } from "@/contexts/CategoriesContext";

export function useCategories() {
  return useCategoriesContext();
}

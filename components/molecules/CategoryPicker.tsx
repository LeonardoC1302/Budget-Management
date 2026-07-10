"use client";

import { useState } from "react";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import CategoryForm from "@/components/molecules/CategoryForm";
import CategoryManageModal from "@/components/molecules/CategoryManageModal";
import { useCategories } from "@/hooks/useCategories";
import type { Category, NewCategory } from "@/lib/types";

interface CategoryPickerProps {
  type: Category["type"];
  value: string;
  onChange: (categoryId: string) => void;
  label?: string;
}

export default function CategoryPicker({
  type,
  value,
  onChange,
  label = "Category",
}: CategoryPickerProps) {
  const { filterByType, add } = useCategories();
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const options = filterByType(type).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  async function handleCreate(input: NewCategory) {
    const created: Category = await add(input);
    onChange(created.id);
    setCreateOpen(false);
  }

  return (
    <>
      <Select
        label={label}
        name="category"
        value={value}
        onChange={onChange}
        options={options}
        footer={(closeMenu) => (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setCreateOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-[8px] text-sm text-accent hover:bg-surface-2 transition-colors"
            >
              + New category
            </button>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setManageOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-[8px] text-sm text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
            >
              Manage categories
            </button>
          </div>
        )}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New category"
      >
        <CategoryForm
          type={type}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <CategoryManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        type={type}
      />
    </>
  );
}

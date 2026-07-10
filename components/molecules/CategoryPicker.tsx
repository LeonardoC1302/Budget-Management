"use client";

import { useState } from "react";
import Modal from "@/components/atoms/Modal";
import Select from "@/components/atoms/Select";
import CategoryForm from "@/components/molecules/CategoryForm";
import { useCategories } from "@/hooks/useCategories";
import type { Category, NewCategory, TransactionType } from "@/lib/types";

interface CategoryPickerProps {
  type: TransactionType;
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
  const [modalOpen, setModalOpen] = useState(false);

  const options = filterByType(type).map((c) => ({
    value: c.id,
    label: c.name,
  }));

  async function handleCreate(input: NewCategory) {
    const created: Category = await add(input);
    onChange(created.id);
    setModalOpen(false);
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
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setModalOpen(true);
            }}
            className="w-full text-left px-3 py-2 rounded-[8px] text-sm text-accent hover:bg-surface-2 transition-colors"
          >
            + New category
          </button>
        )}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New category"
      >
        <CategoryForm
          type={type}
          onSubmit={handleCreate}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

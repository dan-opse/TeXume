"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resume? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh(); // Refresh the server component to update the list
      } else {
        alert("Failed to delete resume.");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete resume.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      disabled={isDeleting}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border-subtle)",
        color: "var(--color-error)",
        cursor: isDeleting ? "not-allowed" : "pointer",
        opacity: isDeleting ? 0.5 : 1,
        transition: "all 0.2s",
      }}
      title="Delete Resume"
    >
      <Trash2 size={18} />
    </button>
  );
}

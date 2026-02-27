"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import type { LookupType } from "@/lib/validations/lookups";

type LookupItem = {
  id: string;
  name: string;
  order?: number;
  isJwt?: boolean;
};

interface LookupTableProps {
  items: LookupItem[];
  type: LookupType;
  hasOrder?: boolean;
  hasIsJwt?: boolean;
  onCreate: (data: { name: string; order?: number; isJwt?: boolean }) => Promise<void>;
  onUpdate: (id: string, data: { name?: string; order?: number; isJwt?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LookupTable({
  items,
  type,
  hasOrder,
  hasIsJwt,
  onCreate,
  onUpdate,
  onDelete,
}: LookupTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrder, setNewOrder] = useState(0);
  const [newIsJwt, setNewIsJwt] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState(0);
  const [editIsJwt, setEditIsJwt] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreate({
        name: newName.trim(),
        ...(hasOrder ? { order: newOrder } : {}),
        ...(hasIsJwt ? { isJwt: newIsJwt } : {}),
      });
      setNewName("");
      setNewOrder(0);
      setNewIsJwt(false);
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: LookupItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditOrder(item.order ?? 0);
    setEditIsJwt(item.isJwt ?? false);
  };

  const handleSave = async () => {
    if (!editingId || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(editingId, {
        name: editName.trim(),
        ...(hasOrder ? { order: editOrder } : {}),
        ...(hasIsJwt ? { isJwt: editIsJwt } : {}),
      });
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditOrder(0);
    setEditIsJwt(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsSubmitting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              {hasOrder && <TableHead className="w-24">Order</TableHead>}
              {hasIsJwt && <TableHead className="w-24">JWT?</TableHead>}
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {editingId === item.id ? (
                  <>
                    <TableCell>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                      />
                    </TableCell>
                    {hasOrder && (
                      <TableCell>
                        <Input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                          className="h-8 w-20"
                        />
                      </TableCell>
                    )}
                    {hasIsJwt && (
                      <TableCell>
                        <Checkbox
                          checked={editIsJwt}
                          onCheckedChange={(checked) => setEditIsJwt(checked === true)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSave}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {hasOrder && <TableCell>{item.order ?? 0}</TableCell>}
                    {hasIsJwt && (
                      <TableCell>
                        {item.isJwt && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            JWT
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}

            {isAdding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Enter name..."
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAdd();
                      if (e.key === "Escape") {
                        setIsAdding(false);
                        setNewName("");
                      }
                    }}
                  />
                </TableCell>
                {hasOrder && (
                  <TableCell>
                    <Input
                      type="number"
                      value={newOrder}
                      onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
                      className="h-8 w-20"
                    />
                  </TableCell>
                )}
                {hasIsJwt && (
                  <TableCell>
                    <Checkbox
                      checked={newIsJwt}
                      onCheckedChange={(checked) => setNewIsJwt(checked === true)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleAdd}
                      disabled={isSubmitting || !newName.trim()}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAdding(false);
                        setNewName("");
                        setNewOrder(0);
                        setNewIsJwt(false);
                      }}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {items.length === 0 && !isAdding && (
              <TableRow>
                <TableCell
                  colSpan={1 + (hasOrder ? 1 : 0) + (hasIsJwt ? 1 : 0) + 1}
                  className="text-center text-muted-foreground py-8"
                >
                  No items yet. Click &ldquo;Add&rdquo; to create one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!isAdding && !editingId && (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add {type === "operating-systems" ? "OS" : type.replace(/-/g, " ").replace(/s$/, "")}
        </Button>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this item is in use, deletion will be prevented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

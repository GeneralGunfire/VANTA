import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import Modal from './Modal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { inventoryItemSchema, type InventoryItemFormValues } from '../lib/schemas/inventory';
import type { InventoryItem } from '../hooks/useInventory';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: InventoryItem) => void;
  onUpdate: (item: InventoryItem) => void;
  /** When set, the modal edits this item instead of creating a new one. */
  editingItem: InventoryItem | null;
}

const toFieldString = (n: number | null) => (n === null || n === undefined ? '' : String(n));

/**
 * Single modal handles both add and edit, following the same structured-
 * insert pattern as AddDebtModal — no NL parsing involved, this is a plain
 * form for a stock record.
 */
export default function InventoryItemModal({ isOpen, onClose, onAdd, onUpdate, editingItem }: InventoryItemModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditing = editingItem !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: { item_name: '', quantity: '', cost_price: '', sale_price: '', reorder_threshold: '' },
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        editingItem
          ? {
              item_name: editingItem.item_name,
              quantity: toFieldString(editingItem.quantity),
              cost_price: toFieldString(editingItem.cost_price),
              sale_price: toFieldString(editingItem.sale_price),
              reorder_threshold: toFieldString(editingItem.reorder_threshold),
            }
          : { item_name: '', quantity: '', cost_price: '', sale_price: '', reorder_threshold: '' },
      );
      setServerError(null);
    }
  }, [isOpen, editingItem, reset]);

  const onSubmit = async (values: InventoryItemFormValues) => {
    setServerError(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      const payload = {
        item_name: values.item_name,
        quantity: Number(values.quantity),
        cost_price: values.cost_price ? Number(values.cost_price) : null,
        sale_price: values.sale_price ? Number(values.sale_price) : null,
        reorder_threshold: values.reorder_threshold ? Number(values.reorder_threshold) : null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { data, error } = await supabase.from('inventory_items').update(payload).eq('id', editingItem.id).select().single();
        if (error) throw error;
        onUpdate(data as InventoryItem);
        toast.success('Item updated');
      } else {
        const { data, error } = await supabase
          .from('inventory_items')
          .insert({ ...payload, anon_id: getAnonId() })
          .select()
          .single();
        if (error) throw error;
        onAdd(data as InventoryItem);
        toast.success('Item added to inventory');
      }

      reset();
      onClose();
    } catch (err: any) {
      console.error('Save inventory item failed:', err);
      setServerError(err?.message ?? String(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      eyebrow={isEditing ? 'Edit item' : 'New item'}
      title={isEditing ? 'Edit inventory item' : 'Add inventory item'}
      icon={<Package size={16} />}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <Label htmlFor="item_name" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Item name
          </Label>
          <Input
            id="item_name"
            placeholder="e.g. Loaf of bread"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black rounded-lg"
            {...register('item_name')}
          />
          {errors.item_name && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.item_name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="quantity" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Quantity on hand
          </Label>
          <Input
            id="quantity"
            inputMode="decimal"
            placeholder="0"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
            {...register('quantity')}
          />
          {errors.quantity && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.quantity.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cost_price" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
              Cost price (R)
            </Label>
            <Input
              id="cost_price"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
              {...register('cost_price')}
            />
          </div>
          <div>
            <Label htmlFor="sale_price" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
              Sale price (R)
            </Label>
            <Input
              id="sale_price"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
              {...register('sale_price')}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="reorder_threshold" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Reorder threshold (optional)
          </Label>
          <Input
            id="reorder_threshold"
            inputMode="decimal"
            placeholder="e.g. 5"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
            {...register('reorder_threshold')}
          />
          <p className="text-xs text-vanta-gray mt-2">Flagged as low stock once quantity falls below this number.</p>
        </div>

        {serverError && (
          <div className="flex items-start gap-2 p-3 border-2 border-vanta-black rounded-lg text-xs text-vanta-black">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            {serverError}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-vanta-gray hover:text-vanta-black transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-vanta-navy text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-vanta-navy-dark transition-colors rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={14} />
            {isSubmitting ? 'Saving…' : isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

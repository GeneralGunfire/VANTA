import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import Modal from './Modal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { addInvoiceSchema, type AddInvoiceFormValues } from '../lib/schemas/invoice';
import type { Invoice } from '../hooks/useInvoices';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (invoice: Invoice) => void;
}

/**
 * Manual invoice creation — direct structured insert into `invoices`,
 * the same-day counterpart to chat-based creation via "invoice X for..."
 * in parse-transaction. Line totals are computed here in code
 * (quantity * unit_price), never left to the model or trusted from raw
 * user input beyond the two numbers entered.
 */
export default function AddInvoiceModal({ isOpen, onClose, onAdd }: AddInvoiceModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddInvoiceFormValues>({
    resolver: zodResolver(addInvoiceSchema),
    defaultValues: { recipient_name: '', line_items: [{ description: '', quantity: '1', unit_price: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' });

  const onSubmit = async (values: AddInvoiceFormValues) => {
    setServerError(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      const lineItems = values.line_items.map((li) => {
        const quantity = Number(li.quantity);
        const unit_price = Number(li.unit_price);
        return { description: li.description, quantity, unit_price, line_total: quantity * unit_price };
      });
      const total = lineItems.reduce((sum, li) => sum + li.line_total, 0);

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          anon_id: getAnonId(),
          recipient_name: values.recipient_name,
          line_items: lineItems,
          total,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      onAdd(data as Invoice);
      reset({ recipient_name: '', line_items: [{ description: '', quantity: '1', unit_price: '' }] });
      onClose();
      toast.success('Draft invoice created');
    } catch (err: any) {
      console.error('Add invoice failed:', err);
      setServerError(err?.message ?? String(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} eyebrow="New invoice" title="Create invoice" icon={<FileText size={16} />} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <Label htmlFor="recipient_name" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Bill to
          </Label>
          <Input
            id="recipient_name"
            placeholder="e.g. Sipho"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black rounded-lg"
            {...register('recipient_name')}
          />
          {errors.recipient_name && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.recipient_name.message}
            </p>
          )}
        </div>

        <div>
          <Label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">Line items</Label>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <Input
                  placeholder="Description"
                  className="flex-1 bg-white border-vanta-border text-sm text-vanta-black rounded-lg"
                  {...register(`line_items.${index}.description` as const)}
                />
                <Input
                  placeholder="Qty"
                  inputMode="decimal"
                  className="w-16 bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
                  {...register(`line_items.${index}.quantity` as const)}
                />
                <Input
                  placeholder="Unit R"
                  inputMode="decimal"
                  className="w-24 bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
                  {...register(`line_items.${index}.unit_price` as const)}
                />
                <button
                  type="button"
                  onClick={() => fields.length > 1 && remove(index)}
                  aria-label="Remove line item"
                  className="p-2 text-vanta-gray hover:text-vanta-black rounded-lg hover:bg-vanta-sidebar transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {errors.line_items && typeof errors.line_items.message === 'string' && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.line_items.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => append({ description: '', quantity: '1', unit_price: '' })}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-vanta-navy hover:text-vanta-navy-dark transition-colors"
          >
            <Plus size={12} />
            Add line
          </button>
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
            {isSubmitting ? 'Saving…' : 'Create draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

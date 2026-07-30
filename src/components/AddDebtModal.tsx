import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/anonId';
import Modal from './Modal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import { addDebtSchema, type AddDebtFormValues } from '../lib/schemas/debt';
import type { Debt } from '../hooks/useDebts';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (debt: Debt) => void;
}

/**
 * Manual debtor/creditor entry — direct structured insert into `debts`,
 * unlike AddTransactionModal which routes through the NL parse pipeline.
 * This is raw structured fields (who, direction, amount), not free text.
 */
export default function AddDebtModal({ isOpen, onClose, onAdd }: AddDebtModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddDebtFormValues>({
    resolver: zodResolver(addDebtSchema),
    defaultValues: { party_name: '', direction: 'owed_to_business', amount: '', description: '' },
  });

  const direction = watch('direction');

  const onSubmit = async (values: AddDebtFormValues) => {
    setServerError(null);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');

      const { data, error } = await supabase
        .from('debts')
        .insert({
          anon_id: getAnonId(),
          party_name: values.party_name,
          direction: values.direction,
          amount: Number(values.amount),
          description: values.description || null,
          status: 'outstanding',
        })
        .select()
        .single();

      if (error) throw error;

      onAdd(data as Debt);
      reset();
      onClose();
      toast.success('Added to your debtors & creditors');
    } catch (err: any) {
      console.error('Add debt failed:', err);
      setServerError(err?.message ?? String(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} eyebrow="New entry" title="Add debtor or creditor" icon={<UserPlus size={16} />} maxWidth="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <Label htmlFor="party_name" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Who
          </Label>
          <Input
            id="party_name"
            placeholder="e.g. Thabo"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black rounded-lg"
            {...register('party_name')}
          />
          {errors.party_name && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.party_name.message}
            </p>
          )}
        </div>

        <div>
          <Label className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">Direction</Label>
          <div className="flex items-center gap-1.5 bg-vanta-sidebar p-1.5 border border-vanta-border rounded-full text-xs">
            {(
              [
                ['owed_to_business', 'They owe you'],
                ['owed_by_business', 'You owe them'],
              ] as const
            ).map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => setValue('direction', key)}
                className={cn(
                  'px-4 py-2 font-medium transition-all rounded-full whitespace-nowrap flex-1',
                  direction === key
                    ? 'bg-white text-vanta-black border border-vanta-border shadow-sm'
                    : 'text-vanta-gray hover:text-vanta-black border border-transparent',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="amount" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Amount (R)
          </Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black font-mono rounded-lg"
            {...register('amount')}
          />
          {errors.amount && (
            <p className="text-xs text-vanta-black mt-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="shrink-0" />
              {errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description" className="block text-[10px] uppercase tracking-widest font-semibold text-vanta-black mb-2">
            Note (optional)
          </Label>
          <Textarea
            id="description"
            rows={2}
            placeholder="e.g. bread order, still owing from last week"
            className="w-full bg-white border-vanta-border text-sm text-vanta-black focus-visible:border-vanta-navy focus-visible:ring-vanta-navy/20 rounded-lg resize-none"
            {...register('description')}
          />
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
            {isSubmitting ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

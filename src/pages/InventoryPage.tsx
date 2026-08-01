import { useState } from 'react';
import { Plus, AlertTriangle, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useInventory, type InventoryItem } from '../hooks/useInventory';
import InventoryItemModal from '../components/InventoryItemModal';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';

const fmt = (n: number | null) => (n === null || n === undefined ? '—' : `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function isLowStock(item: InventoryItem): boolean {
  return item.reorder_threshold !== null && item.quantity < item.reorder_threshold;
}

/**
 * Manually-maintained stock list only. Stock is NOT auto-deducted when a
 * sale is parsed in chat — reliably matching a free-text sale description
 * to a specific inventory row is a separate, more complex future feature.
 * See final report.
 */
export default function InventoryPage() {
  const { items, isLoading, loadError, addItem, updateItem, removeItem } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const openAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!supabase) return;
    try {
      await removeItem(item.id);
      toast.success(`Removed "${item.item_name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Could not delete — try again.');
    }
  };

  const lowStockCount = items.filter(isLowStock).length;

  return (
    <div className="relative flex-1 overflow-y-auto pt-12 px-6 md:px-12 lg:px-16 pb-32">
      <InventoryItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addItem}
        onUpdate={updateItem}
        editingItem={editingItem}
      />

      <div className="relative max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-serif text-vanta-black tracking-tight">Inventory</h1>
            <p className="text-sm text-vanta-gray mt-1">
              Stock you currently hold{lowStockCount > 0 ? ` — ${lowStockCount} item${lowStockCount === 1 ? '' : 's'} below reorder threshold` : ''}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="text-white px-5 py-2.5 text-xs font-semibold transition-all flex items-center gap-2 rounded-lg active:scale-[0.98] bg-vanta-navy hover:bg-vanta-navy-dark shadow-[0_6px_18px_-6px_rgba(1,90,234,0.45)] hover:shadow-[0_8px_22px_-6px_rgba(1,90,234,0.55)] hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Add item
          </button>
        </div>

        <div className="border border-vanta-border rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 1px 2px rgba(17,24,39,0.03), 0 10px 30px rgba(17,24,39,0.05)' }}>
          {isLoading ? (
            <div className="text-center py-16 text-vanta-gray text-sm italic">Loading…</div>
          ) : loadError ? (
            <div role="alert" className="flex items-center justify-center gap-2 py-16 text-vanta-black text-sm px-6">
              <AlertTriangle size={16} />
              Couldn't load inventory: {loadError}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-vanta-gray text-sm px-6 leading-relaxed flex flex-col items-center gap-3">
              <Package size={20} className="text-vanta-gray-light" />
              Nothing in stock yet — add your first item to start tracking quantity, cost, and sale price.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-vanta-sidebar text-vanta-gray uppercase tracking-wider text-[10px] hover:bg-vanta-sidebar">
                    <TableHead className="font-semibold px-4 py-3 h-auto text-left">Item</TableHead>
                    <TableHead className="font-semibold px-4 py-3 h-auto text-right">Quantity</TableHead>
                    <TableHead className="font-semibold px-4 py-3 h-auto text-right">Cost price</TableHead>
                    <TableHead className="font-semibold px-4 py-3 h-auto text-right">Sale price</TableHead>
                    <TableHead className="font-semibold px-4 py-3 h-auto text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const low = isLowStock(item);
                    return (
                      <TableRow
                        key={item.id}
                        className={cn('hover:bg-vanta-sidebar/50', low && 'border-l-2 border-l-vanta-black')}
                      >
                        <TableCell className="px-4 py-3">
                          <div className="text-vanta-black font-medium">{item.item_name}</div>
                          {low && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-widest text-vanta-black">
                              <AlertTriangle size={11} />
                              Low stock
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-vanta-black">{item.quantity}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-vanta-gray">{fmt(item.cost_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-vanta-black">{fmt(item.sale_price)}</TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(item)}
                              aria-label={`Edit ${item.item_name}`}
                              className="p-1.5 rounded-lg text-vanta-gray hover:text-vanta-black hover:bg-vanta-sidebar transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              aria-label={`Delete ${item.item_name}`}
                              className="p-1.5 rounded-lg text-vanta-gray hover:text-vanta-black hover:bg-vanta-sidebar transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BookOpen, Plus, Banknote, Receipt, MessageCircleQuestion } from 'lucide-react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from './ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXAMPLE_PROMPTS = [
  { label: 'Log a sale', icon: Banknote, prompt: 'sold 20 loaves, R400 cash' },
  { label: 'Log an expense', icon: Receipt, prompt: 'bought flour for R180' },
  { label: "Ask how you're doing", icon: MessageCircleQuestion, prompt: "how's business this week?" },
];

/** Global ⌘K / Ctrl+K command palette — navigate, add a transaction, or jump straight into an example prompt. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const go = (path: string, state?: Record<string, unknown>) => {
    onOpenChange(false);
    navigate(path, state ? { state } : undefined);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search or jump to…">
      <CommandInput placeholder="Search or jump to…" />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go('/app/chat')}>
            <Home />
            Go to Home
          </CommandItem>
          <CommandItem onSelect={() => go('/app/ledger')}>
            <BookOpen />
            Go to Ledger
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go('/app/ledger', { openAddModal: true })}>
            <Plus />
            Add transaction
            <CommandShortcut>Ledger</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Try it">
          {EXAMPLE_PROMPTS.map((item) => (
            <CommandItem key={item.prompt} onSelect={() => go('/app/chat', { prefill: item.prompt })}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Hook that owns the ⌘K/Ctrl+K global shortcut — call once per app shell. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return { open, setOpen };
}

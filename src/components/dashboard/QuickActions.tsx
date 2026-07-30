interface QuickActionsProps {
  onSelect: (prompt: string) => void;
}

/**
 * Suggested phrasings below the composer.
 *
 * These used to be four equal bordered tiles, each with a decorative icon chip
 * that restated its own label. Reworked into the "example prompt" row used by
 * Linear's command bar and Raycast: the thing the user is actually going to
 * type is the visible content, in the composer's own mono voice, so clicking
 * one obviously fills the box. The verb prefix stays muted so the eye lands on
 * the concrete example, not the category.
 */
const ACTIONS = [
  { verb: 'Record a sale', prompt: 'sold 20 loaves, R400 cash' },
  { verb: 'Record an expense', prompt: 'bought flour for R180' },
  { verb: 'Log a deposit', prompt: 'deposited R2,000 cash at the bank' },
  { verb: 'Ask about the week', prompt: "how's business this week?" },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="w-full flex flex-wrap gap-x-2 gap-y-1.5">
      {ACTIONS.map((action) => (
        <button
          key={action.verb}
          onClick={() => onSelect(action.prompt)}
          className="group inline-flex items-baseline gap-1.5 rounded-full border border-vanta-border bg-white px-3 py-1.5 text-left transition-colors duration-150 hover:border-vanta-navy/30 hover:bg-accent"
        >
          <span className="text-[12px] text-vanta-gray group-hover:text-vanta-navy transition-colors duration-150">
            {action.verb}
          </span>
          <span className="text-[12px] font-mono text-vanta-gray-light truncate max-w-45">
            {action.prompt}
          </span>
        </button>
      ))}
    </div>
  );
}

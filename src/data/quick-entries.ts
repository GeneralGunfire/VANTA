/**
 * Tap-to-log phrasings for the Templates page.
 *
 * Every category here matches the `category` values the parse-transaction Edge
 * Function can return, so a tapped template lands in a real ledger category
 * rather than something the backend would have to guess at.
 */

export type EntryCategory = 'Sales' | 'Stock' | 'Rent' | 'Utilities' | 'Transport' | 'Wages' | 'Other';

export interface QuickEntry {
  category: EntryCategory;
  /** The phrase dropped into the composer. Amounts are examples — edit before sending. */
  phrase: string;
  /** What this template is for, in the owner's own terms. */
  hint: string;
}

export const QUICK_ENTRIES: QuickEntry[] = [
  // Money in
  { category: 'Sales', phrase: 'sold 20 loaves R400 cash', hint: 'A straight cash sale' },
  { category: 'Sales', phrase: 'sold 3 crates of cooldrink R250', hint: 'Selling stock by the crate or case' },
  { category: 'Sales', phrase: 'customer paid R150 for airtime', hint: 'Airtime and data sales' },
  { category: 'Sales', phrase: 'took R600 today in the shop', hint: "A whole day's takings in one line" },

  // Money out
  { category: 'Stock', phrase: 'bought flour for R180', hint: 'Ingredients or goods to resell' },
  { category: 'Stock', phrase: 'bought stock from the wholesaler R1200', hint: 'A bulk restock run' },
  { category: 'Rent', phrase: 'paid shop rent R2500', hint: 'Rent for your stand, shop or table' },
  { category: 'Utilities', phrase: 'bought R100 electricity', hint: 'Prepaid electricity or water' },
  { category: 'Transport', phrase: 'taxi fare to the wholesaler R60', hint: 'Getting stock to and from the shop' },
  { category: 'Transport', phrase: 'petrol R400', hint: 'Fuel for deliveries or collections' },
  { category: 'Wages', phrase: 'paid helper R250 for the day', hint: 'Casual or daily wages' },
  { category: 'Other', phrase: 'bought airtime R50 for the business phone', hint: "Anything that doesn't fit the rest" },
];

/** Two transactions in one message — the parser splits them into separate records. */
export const COMBINED_EXAMPLE = 'sold 20 loaves R400 cash, bought flour for R180';

/** Plain-English questions Vanta answers in a sentence, never a chart. */
export const QUESTION_EXAMPLES = [
  "how's business this week?",
  'how much did I spend on stock this month?',
  'what still needs my review?',
  'what did I take in yesterday?',
];

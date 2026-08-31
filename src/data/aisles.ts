export type AisleId =
  | 'produce'
  | 'dairy_eggs'
  | 'meat_fish'
  | 'bakery'
  | 'dry_goods'
  | 'canned'
  | 'frozen'
  | 'spices'
  | 'condiments'
  | 'snacks'
  | 'beverages'
  | 'household'
  | 'other';

export const AISLE_IDS: AisleId[] = [
  'produce',
  'dairy_eggs',
  'meat_fish',
  'bakery',
  'dry_goods',
  'canned',
  'frozen',
  'spices',
  'condiments',
  'snacks',
  'beverages',
  'household',
  'other',
];

// Keywords are substring-matched against the normalized ingredient name
// (Hebrew + English in one list). MATCH_ORDER puts the more specific aisles
// first so "פלפל שחור" hits spices before "פלפל" would hit produce.
const KEYWORDS: Record<AisleId, string[]> = {
  spices: [
    'מלח', 'פלפל שחור', 'פלפל לבן', 'פפריקה', 'כמון', 'כורכום', 'קינמון', 'זעתר', 'אורגנו',
    'רוזמרין יבש', 'הל', 'ציפורן', 'אגוז מוסקט', 'קארי', 'צ\'ילי', "צ'ילי", 'תבלין', 'שומשום',
    'salt', 'black pepper', 'white pepper', 'paprika', 'cumin', 'turmeric', 'cinnamon', 'oregano',
    'chili flakes', 'red pepper flakes', 'nutmeg', 'curry', 'cardamom', 'clove spice', 'spice', 'sesame',
    'za\'atar', 'allspice', 'bay lea',
  ],
  canned: [
    'שימורים', 'מרוסק', 'רסק', 'קופסת תירס', 'תירס', 'זיתים', 'חמוצים', 'מלפפון חמוץ',
    'גרגירי חומוס', 'שעועית לבנה', 'שעועית שחורה', 'חלב קוקוס', 'קרם קוקוס',
    'crushed tomato', 'tomato paste', 'tomato sauce', 'canned', 'corn', 'olive', 'pickle',
    'chickpea', 'black bean', 'white bean', 'kidney bean', 'coconut milk', 'coconut cream',
  ],
  frozen: ['קפוא', 'קפואה', 'אפונה', 'frozen', 'peas'],
  condiments: [
    'שמן', 'חומץ', 'סויה', 'טחינה', 'מיונז', 'קטשופ', 'חרדל', 'דבש', 'סילאן', 'מייפל',
    'רוטב', 'סירופ', 'משחת', 'חמאת בוטנים',
    'oil', 'vinegar', 'soy sauce', 'tahini', 'mayo', 'ketchup', 'mustard', 'honey', 'maple',
    'syrup', 'dressing', 'peanut butter', 'sriracha', 'pesto',
  ],
  dairy_eggs: [
    'חלב', 'ביצ', 'גבינ', 'יוגורט', 'שמנת', 'חמאה', 'קוטג', 'לבנה', 'מוצרלה', 'פרמזן', 'פטה',
    'ריקוטה', 'מסקרפונה', 'גבינה צהובה',
    'milk', 'egg', 'cheese', 'yogurt', 'yoghurt', 'cream', 'butter', 'mozzarella', 'parmesan',
    'feta', 'ricotta', 'cottage', 'mascarpone',
  ],
  meat_fish: [
    'עוף', 'הודו', 'בקר', 'טחון', 'כבש', 'טלה', 'נקניק', 'סלמון', 'טונה', 'דג', 'פילה', 'שניצל',
    'כרעיים', 'שוקיים', 'חזה', 'אנטריקוט', 'המבורגר',
    'chicken', 'beef', 'turkey', 'lamb', 'sausage', 'bacon', 'salmon', 'tuna', 'fish', 'shrimp',
    'mince', 'ground beef', 'steak', 'fillet', 'schnitzel',
  ],
  bakery: [
    'לחם', 'פיתה', 'פיתות', 'לחמני', 'חלה', 'טורטיה', 'בגט', 'קרואסון',
    'bread', 'pita', 'bun', 'tortilla', 'baguette', 'croissant', 'challah', 'roll',
  ],
  dry_goods: [
    'קמח', 'סוכר', 'אורז', 'פסטה', 'ספגטי', 'קוסקוס', 'בורגול', 'קינואה', 'עדשים', 'שיבולת שועל',
    'פתיתים', 'אטריות', 'סולת', 'אבקת אפיה', 'אבקת סוכר', 'סודה לשתיה', 'שמרים', 'קורנפלור',
    'וניל', 'קקאו', 'שוקולד', 'צימוקים', 'אגוז', 'שקדים', 'בוטנים', 'פירורי לחם', 'פנקו', 'עמילן',
    'flour', 'sugar', 'rice', 'pasta', 'spaghetti', 'noodle', 'couscous', 'quinoa', 'lentil',
    'oat', 'baking powder', 'baking soda', 'yeast', 'cornstarch', 'vanilla', 'cocoa', 'chocolate',
    'raisin', 'almond', 'walnut', 'pecan', 'peanut', 'breadcrumb', 'panko', 'powdered sugar',
  ],
  beverages: [
    'מים', 'מיץ', 'יין', 'בירה', 'קפה', 'תה', 'סודה', 'קולה',
    'water', 'juice', 'wine', 'beer', 'coffee', 'tea', 'soda', 'cola', 'sparkling',
  ],
  snacks: [
    'חטיף', 'ביסקוויט', 'עוגי', 'קרקר', 'במבה', 'בייגלה',
    'chips', 'cracker', 'cookie', 'snack', 'pretzel', 'biscuit',
  ],
  household: [
    'נייר אפיה', 'נייר סופג', 'סבון', 'אקונומיקה', 'שקיות אשפה', 'נייר כסף',
    'baking paper', 'parchment', 'paper towel', 'soap', 'detergent', 'foil', 'trash bag',
  ],
  produce: [
    'עגבני', 'מלפפון', 'בצל', 'שום', 'גזר', 'תפוח', 'בננה', 'לימון', 'ליים', 'פלפל', 'חסה',
    'כרוב', 'קישוא', 'חציל', 'בטטה', 'פטרוזיליה', 'כוסברה', 'שמיר', 'בזיליקום', 'נענע', 'תרד',
    'פטרי', 'אבוקדו', 'תות', 'ענבים', 'תפוז', 'סלרי', 'כרובית', 'ברוקולי', 'צנונית', 'סלק',
    'דלעת', 'שעועית ירוקה', 'ג\'ינג\'ר', 'זנגביל', 'רימון', 'אגס', 'אפרסק', 'שזיף', 'מנגו', 'קיווי',
    'tomato', 'cucumber', 'onion', 'garlic', 'carrot', 'potato', 'apple', 'banana', 'lemon',
    'lime', 'pepper', 'lettuce', 'cabbage', 'zucchini', 'eggplant', 'spinach', 'mushroom',
    'avocado', 'strawberr', 'berry', 'berries', 'orange', 'celery', 'cauliflower', 'broccoli',
    'beet', 'pumpkin', 'squash', 'green bean', 'herb', 'cilantro', 'parsley', 'basil', 'mint',
    'ginger', 'scallion', 'shallot', 'leek', 'radish', 'grape', 'mango', 'peach', 'pear', 'kiwi',
    'pomegranate', 'dill', 'thyme', 'rosemary', 'sweet potato', 'kale', 'arugula',
  ],
  other: [],
};

export const MATCH_ORDER: AisleId[] = [
  'spices',
  'canned',
  'frozen',
  'condiments',
  'dairy_eggs',
  'meat_fish',
  'bakery',
  'dry_goods',
  'beverages',
  'snacks',
  'household',
  'produce',
];

export function aisleFor(normalizedName: string): AisleId {
  const n = normalizedName.toLowerCase();
  if (!n) return 'other';
  for (const aisle of MATCH_ORDER) {
    for (const kw of KEYWORDS[aisle]) {
      if (n.includes(kw)) return aisle;
    }
  }
  return 'other';
}

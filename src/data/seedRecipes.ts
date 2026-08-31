import type { Cookbook, CookbookRecipe, GroceryItem, MealPlanEntry, Recipe } from '../lib/types';
import { parseIngredientBlock } from '../lib/parse/ingredient';
import { aisleFor } from './aisles';
import { normalizeName } from '../lib/parse/ingredient';
import { dateKey, startOfWeek, addDays } from '../lib/format';

// Demo seed: 6 personal recipes (Hebrew-first) + 3 community recipes, two
// cookbooks, a few planner slots for the current week and a starter grocery
// list — so search, scaling, grocery and the planner all demo well offline.
// Ingredient lines run through the real parser, so the seed doubles as a
// living exercise of the Hebrew/English grammar.

export const DEMO_UID = 'demo-user';

type SeedRecipe = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  source_url?: string | null;
  source_name?: string | null;
  prep_min: number | null;
  cook_min: number | null;
  servings: number | null;
  ingredientLines: string;
  stepLines: string[];
  notes?: string | null;
  tags: string[];
  nutrition?: Recipe['nutrition'];
  favorite?: boolean;
  is_public?: boolean;
  lang: 'he' | 'en';
};

const seeds: SeedRecipe[] = [
  {
    id: 'seed-shakshuka',
    owner_id: DEMO_UID,
    title: 'שקשוקה קלאסית',
    description: 'שקשוקה עשירה ברוטב עגבניות מתובל — ארוחת בוקר ישראלית מושלמת.',
    prep_min: 10,
    cook_min: 15,
    servings: 2,
    ingredientLines: [
      '2 ביצים',
      '1 בצל קצוץ',
      '2 שיני שום כתושות',
      '1 פלפל אדום חתוך לקוביות',
      '2 כפות שמן זית',
      '400 גרם עגבניות מרוסקות',
      '1 כפית פפריקה מתוקה',
      'חצי כפית כמון',
      'מלח ופלפל שחור לפי הטעם',
      'רבע כוס פטרוזיליה קצוצה',
    ].join('\n'),
    stepLines: [
      'מחממים שמן זית במחבת רחבה ומטגנים את הבצל עד הזהבה.',
      'מוסיפים שום ופלפל אדום ומטגנים עוד 3 דקות.',
      'מוסיפים את העגבניות המרוסקות והתבלינים, ומבשלים 8 דקות עד שהרוטב מסמיך.',
      'יוצרים גומות ברוטב ושוברים לתוכן את הביצים.',
      'מכסים ומבשלים 4-5 דקות עד שהחלבון מתייצב. מפזרים פטרוזיליה ומגישים עם לחם טרי.',
    ],
    tags: ['breakfast', 'israeli', 'quick', 'vegetarian'],
    nutrition: { calories: 320, protein: 15, carbs: 18, fat: 21 },
    favorite: true,
    lang: 'he',
  },
  {
    id: 'seed-lentil-soup',
    owner_id: DEMO_UID,
    title: 'מרק עדשים כתומות',
    description: 'מרק חורפי מחמם, טבעוני ופשוט להכנה בסיר אחד.',
    prep_min: 10,
    cook_min: 30,
    servings: 6,
    ingredientLines: [
      '2 כוסות עדשים כתומות',
      '1 בצל גדול קצוץ',
      '2 גזרים חתוכים לקוביות',
      '3 שיני שום',
      '2 כפות שמן זית',
      '1 כפית כמון',
      'חצי כפית כורכום',
      '8 כוסות מים',
      'מלח ופלפל לפי הטעם',
      'מיץ מחצי לימון',
    ].join('\n'),
    stepLines: [
      'שוטפים את העדשים היטב.',
      'מטגנים בצל, גזר ושום בשמן זית כ-5 דקות.',
      'מוסיפים את העדשים, התבלינים והמים ומביאים לרתיחה.',
      'מנמיכים את האש ומבשלים 25 דקות עד שהעדשים מתרככות.',
      'טוחנים חלקית בבלנדר מוט, מוסיפים מיץ לימון ומתקנים תיבול.',
    ],
    tags: ['soup', 'vegan', 'healthy', 'budget'],
    lang: 'he',
  },
  {
    id: 'seed-cookies',
    owner_id: DEMO_UID,
    title: "עוגיות שוקולד צ'יפס",
    description: 'עוגיות רכות בפנים ופריכות בקצוות — הכמות מספיקה ל-24 עוגיות.',
    prep_min: 15,
    cook_min: 12,
    servings: 24,
    ingredientLines: [
      'לבצק:',
      '2 כוסות קמח',
      '1 כפית אבקת אפיה',
      'חצי כפית מלח',
      '200 גרם חמאה רכה',
      'שלושת רבעי כוס סוכר חום',
      'חצי כוס סוכר לבן',
      '2 ביצים',
      '1 כפית תמצית וניל',
      'לתוספת:',
      "1,5 כוסות שוקולד צ'יפס",
    ].join('\n'),
    stepLines: [
      'מחממים תנור ל-180 מעלות ומרפדים תבנית בנייר אפיה.',
      'מקציפים חמאה עם שני סוגי הסוכר עד לקבלת קרם בהיר.',
      'מוסיפים ביצים ווניל וטורפים היטב.',
      "מקפלים פנימה את הקמח, אבקת האפיה והמלח, ולבסוף את השוקולד צ'יפס.",
      'יוצרים כדורים ואופים 10-12 דקות עד שהקצוות מזהיבים.',
    ],
    tags: ['dessert', 'baking', 'family'],
    lang: 'he',
  },
  {
    id: 'seed-pancakes',
    owner_id: DEMO_UID,
    title: 'Fluffy Pancakes',
    description: 'Weekend-worthy pancakes with crisp edges and a cloud-soft middle.',
    prep_min: 10,
    cook_min: 20,
    servings: 4,
    ingredientLines: [
      '1½ cups flour',
      '2 tbsp sugar',
      '1 tbsp baking powder',
      '½ tsp salt',
      '¾ cup milk',
      '2 eggs',
      '3 tbsp butter, melted',
      '1 tsp vanilla extract',
    ].join('\n'),
    stepLines: [
      'Whisk the flour, sugar, baking powder and salt in a large bowl.',
      'Whisk the milk, eggs, melted butter and vanilla in a jug.',
      'Pour the wet mix into the dry and stir until just combined (lumps are fine).',
      'Cook ladlefuls on a buttered pan over medium heat, 2 minutes per side.',
      'Serve warm with maple syrup.',
    ],
    tags: ['breakfast', 'quick', 'family'],
    nutrition: { calories: 280, protein: 8, carbs: 38, fat: 10 },
    favorite: true,
    lang: 'en',
  },
  {
    id: 'seed-pasta',
    owner_id: DEMO_UID,
    title: 'Creamy Tomato Pasta',
    description: 'A 25-minute vegetarian dinner the whole family fights over.',
    prep_min: 5,
    cook_min: 20,
    servings: 3,
    ingredientLines: [
      '300 גרם פסטה פנה',
      '2-3 שיני שום פרוסות',
      '2 כפות שמן זית',
      '400 גרם עגבניות מרוסקות',
      'חצי כוס שמנת לבישול',
      'רבע כוס פרמזן מגורר',
      'צרור בזיליקום טרי',
      'מלח ופלפל שחור',
    ].join('\n'),
    stepLines: [
      'מבשלים את הפסטה במים רותחים ומלוחים לפי ההוראות, ושומרים כוס ממי הבישול.',
      'מטגנים שום בשמן זית חצי דקה, מוסיפים עגבניות מרוסקות ומבשלים 10 דקות.',
      'מוסיפים שמנת, פרמזן ומעט ממי הפסטה ומערבבים לרוטב חלק.',
      'מקפלים את הפסטה לרוטב, מתבלים ומפזרים בזיליקום.',
    ],
    tags: ['dinner', 'italian', 'vegetarian', 'quick'],
    lang: 'he',
  },
  {
    id: 'seed-banana-bread',
    owner_id: DEMO_UID,
    title: 'Banana Bread',
    description: 'The best use for spotty bananas — moist, fragrant, one bowl.',
    source_url: 'https://www.simplyrecipes.com/recipes/banana_bread/',
    source_name: 'simplyrecipes.com',
    prep_min: 15,
    cook_min: 60,
    servings: 10,
    ingredientLines: [
      '3 ripe bananas, mashed',
      '1/2 cup butter, melted',
      '3/4 cup sugar',
      '1 egg',
      '1 tsp vanilla extract',
      '1 tsp baking soda',
      'pinch of salt',
      '1 1/2 cups flour',
      '1/2 cup walnuts, chopped',
    ].join('\n'),
    stepLines: [
      'Preheat the oven to 175C and butter a loaf pan.',
      'Mix the mashed bananas with the melted butter.',
      'Stir in the sugar, egg and vanilla.',
      'Sprinkle over the baking soda and salt, then fold in the flour and walnuts.',
      'Pour into the pan and bake for 55-65 minutes, until a skewer comes out clean.',
    ],
    tags: ['dessert', 'baking'],
    nutrition: { calories: 310, protein: 5, carbs: 45, fat: 13 },
    lang: 'en',
  },
  // --- community (public) recipes for the Discover tab ---
  {
    id: 'seed-public-hummus',
    owner_id: 'community-michal',
    title: 'חומוס ביתי קטיפתי',
    description: 'הסוד הוא בישול ארוך עם סודה לשתיה וטחינה איכותית.',
    source_name: 'מיכל מבשלת',
    prep_min: 15,
    cook_min: 90,
    servings: 8,
    ingredientLines: [
      '2 כוסות גרגירי חומוס יבשים',
      '1 כפית סודה לשתיה',
      '1 כוס טחינה גולמית',
      'מיץ מ-2 לימונים',
      '3 שיני שום',
      '1 כפית מלח',
      'חצי כפית כמון',
    ].join('\n'),
    stepLines: [
      'משרים את הגרגירים במים למשך לילה.',
      'מבשלים עם סודה לשתיה כשעה וחצי עד ריכוך מלא.',
      'טוחנים חם עם טחינה, מיץ לימון, שום ותבלינים עד לקבלת מרקם קטיפתי.',
      'מגישים עם שמן זית, פפריקה וגרגירים שלמים.',
    ],
    tags: ['israeli', 'vegan', 'mediterranean'],
    is_public: true,
    lang: 'he',
  },
  {
    id: 'seed-public-salad',
    owner_id: 'community-dana',
    title: 'סלט ירקות קצוץ עם לימון ונענע',
    description: 'הסלט הישראלי הקלאסי — קיצוץ דק, לימון ושמן זית טוב.',
    source_name: 'דנה במטבח',
    prep_min: 15,
    cook_min: null,
    servings: 4,
    ingredientLines: [
      '4 עגבניות',
      '4 מלפפונים',
      '1 בצל סגול קטן',
      'רבע כוס נענע קצוצה',
      'מיץ מלימון שלם',
      '3 כפות שמן זית',
      'מלח ופלפל שחור',
    ].join('\n'),
    stepLines: [
      'קוצצים את כל הירקות דק ככל האפשר.',
      'מערבבים עם נענע, מיץ לימון, שמן זית, מלח ופלפל.',
      'טועמים ומאזנים חמיצות ומלח לפני ההגשה.',
    ],
    tags: ['salad', 'israeli', 'vegan', 'healthy', 'quick'],
    is_public: true,
    lang: 'he',
  },
  {
    id: 'seed-public-chicken',
    owner_id: 'community-yossi',
    title: 'One-Pan Lemon Chicken',
    description: 'Crispy thighs, jammy lemons and potatoes — all in one pan.',
    source_name: 'Yossi Cooks',
    prep_min: 10,
    cook_min: 45,
    servings: 4,
    ingredientLines: [
      '8 chicken thighs',
      '4 potatoes, cut into wedges',
      '1 lemon, sliced',
      '6 cloves garlic',
      '3 tbsp olive oil',
      '1 tsp paprika',
      '1 tsp dried oregano',
      'salt and black pepper',
    ].join('\n'),
    stepLines: [
      'Preheat the oven to 200C.',
      'Toss everything together in a large roasting pan.',
      'Roast for 40-45 minutes until the chicken is crisp and the potatoes are golden.',
      'Spoon the pan juices over before serving.',
    ],
    tags: ['dinner', 'family', 'quick'],
    is_public: true,
    lang: 'en',
  },
];

function toRecipe(seed: SeedRecipe, now: string): Recipe {
  return {
    id: seed.id,
    owner_id: seed.owner_id,
    title: seed.title,
    description: seed.description,
    image_path: null,
    image_url: null,
    source_url: seed.source_url ?? null,
    source_name: seed.source_name ?? null,
    prep_min: seed.prep_min,
    cook_min: seed.cook_min,
    total_min: seed.prep_min != null || seed.cook_min != null ? (seed.prep_min ?? 0) + (seed.cook_min ?? 0) : null,
    servings: seed.servings,
    ingredients: parseIngredientBlock(seed.ingredientLines),
    steps: seed.stepLines.map((text) => ({ text, group: null })),
    notes: seed.notes ?? null,
    tags: seed.tags,
    nutrition: seed.nutrition ?? null,
    favorite: seed.favorite ?? false,
    is_public: seed.is_public ?? false,
    lang: seed.lang,
    created_at: now,
    updated_at: now,
  };
}

export type SeedData = {
  recipes: Recipe[];
  cookbooks: Cookbook[];
  cookbookRecipes: CookbookRecipe[];
  groceryItems: GroceryItem[];
  plans: MealPlanEntry[];
};

export function buildSeed(): SeedData {
  const now = new Date().toISOString();
  const recipes = seeds.map((s) => toRecipe(s, now));

  const cookbooks: Cookbook[] = [
    { id: 'cb-week', owner_id: DEMO_UID, name: 'ארוחות השבוע', emoji: '🍽️', invite_token: 'demo-invite-week', created_at: now },
    { id: 'cb-sweet', owner_id: DEMO_UID, name: 'Sweet Things', emoji: '🍰', invite_token: 'demo-invite-sweet', created_at: now },
  ];

  const cookbookRecipes: CookbookRecipe[] = [
    { id: 'cbr1', cookbook_id: 'cb-week', recipe_id: 'seed-shakshuka' },
    { id: 'cbr2', cookbook_id: 'cb-week', recipe_id: 'seed-lentil-soup' },
    { id: 'cbr3', cookbook_id: 'cb-week', recipe_id: 'seed-pasta' },
    { id: 'cbr4', cookbook_id: 'cb-sweet', recipe_id: 'seed-cookies' },
    { id: 'cbr5', cookbook_id: 'cb-sweet', recipe_id: 'seed-banana-bread' },
  ];

  const mkItem = (id: string, name: string, qty: number | null, unit: string | null): GroceryItem => ({
    id,
    user_id: DEMO_UID,
    name,
    normalized_name: normalizeName(name),
    qty,
    unit,
    aisle: aisleFor(normalizeName(name)),
    recipe_id: null,
    recipe_title: null,
    checked: false,
    created_at: now,
  });

  const groceryItems: GroceryItem[] = [
    mkItem('g1', 'חלב', 1, 'l'),
    mkItem('g2', 'לחם', null, null),
    mkItem('g3', 'עגבניות', 6, null),
  ];

  const week = startOfWeek(new Date());
  const plans: MealPlanEntry[] = [
    { id: 'p1', user_id: DEMO_UID, plan_date: dateKey(week), slot: 'dinner', recipe_id: 'seed-shakshuka', servings: 2 },
    { id: 'p2', user_id: DEMO_UID, plan_date: dateKey(addDays(week, 1)), slot: 'breakfast', recipe_id: 'seed-pancakes', servings: 4 },
    { id: 'p3', user_id: DEMO_UID, plan_date: dateKey(addDays(week, 1)), slot: 'dinner', recipe_id: 'seed-pasta', servings: 3 },
    { id: 'p4', user_id: DEMO_UID, plan_date: dateKey(addDays(week, 2)), slot: 'dinner', recipe_id: 'seed-lentil-soup', servings: 6 },
  ];

  return { recipes, cookbooks, cookbookRecipes, groceryItems, plans };
}

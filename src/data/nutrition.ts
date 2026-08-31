// Offline nutrition reference for the estimator: ~120 staple foods, Hebrew +
// English match names (compared against normalizeName() output, substring,
// longest name wins). Values are rounded USDA-style per-100g figures plus a
// cup weight (density) and a typical per-unit weight where it makes sense.
// Estimates only — the UI always labels results as approximate.

export type FoodDef = {
  names: string[];
  per100g: { cal: number; protein: number; carbs: number; fat: number };
  gPerCup?: number;
  gPerUnit?: number;
};

export const FOODS: FoodDef[] = [
  // --- baking & dry goods ---
  { names: ['קמח מלא', 'whole wheat flour'], per100g: { cal: 340, protein: 13, carbs: 72, fat: 2.5 }, gPerCup: 120 },
  { names: ['קמח', 'flour'], per100g: { cal: 364, protein: 10, carbs: 76, fat: 1 }, gPerCup: 120 },
  { names: ['סוכר חום', 'brown sugar'], per100g: { cal: 380, protein: 0, carbs: 98, fat: 0 }, gPerCup: 220 },
  { names: ['אבקת סוכר', 'powdered sugar'], per100g: { cal: 389, protein: 0, carbs: 100, fat: 0 }, gPerCup: 120 },
  { names: ['סוכר', 'sugar'], per100g: { cal: 387, protein: 0, carbs: 100, fat: 0 }, gPerCup: 200 },
  { names: ['אורז', 'rice'], per100g: { cal: 360, protein: 7, carbs: 79, fat: 1 }, gPerCup: 185 },
  { names: ['פסטה', 'ספגטי', 'פנה', 'אטריות', 'pasta', 'spaghetti', 'penne', 'noodle'], per100g: { cal: 371, protein: 13, carbs: 75, fat: 1.5 }, gPerCup: 100 },
  { names: ['קוסקוס', 'couscous'], per100g: { cal: 376, protein: 13, carbs: 77, fat: 1 }, gPerCup: 173 },
  { names: ['בורגול', 'bulgur'], per100g: { cal: 342, protein: 12, carbs: 76, fat: 1.3 }, gPerCup: 140 },
  { names: ['קינואה', 'quinoa'], per100g: { cal: 368, protein: 14, carbs: 64, fat: 6 }, gPerCup: 170 },
  { names: ['עדשים', 'lentil'], per100g: { cal: 353, protein: 26, carbs: 60, fat: 1 }, gPerCup: 192 },
  { names: ['גרגירי חומוס', 'חומוס יבש', 'chickpea'], per100g: { cal: 378, protein: 20, carbs: 63, fat: 6 }, gPerCup: 200, gPerUnit: 400 },
  { names: ['שיבולת שועל', 'קוואקר', 'oat'], per100g: { cal: 389, protein: 17, carbs: 66, fat: 7 }, gPerCup: 90 },
  { names: ['סולת', 'semolina'], per100g: { cal: 360, protein: 13, carbs: 73, fat: 1 }, gPerCup: 167 },
  { names: ['פירורי לחם', 'פנקו', 'breadcrumb', 'panko'], per100g: { cal: 395, protein: 13, carbs: 72, fat: 5 }, gPerCup: 108 },
  { names: ['קורנפלור', 'עמילן תירס', 'cornstarch'], per100g: { cal: 381, protein: 0.3, carbs: 91, fat: 0 }, gPerCup: 128 },
  { names: ['אבקת אפיה', 'baking powder'], per100g: { cal: 53, protein: 0, carbs: 28, fat: 0 }, gPerCup: 220 },
  { names: ['שמרים', 'yeast'], per100g: { cal: 325, protein: 40, carbs: 41, fat: 8 }, gPerCup: 150 },
  { names: ['קקאו', 'cocoa'], per100g: { cal: 228, protein: 20, carbs: 58, fat: 14 }, gPerCup: 85 },
  { names: ["שוקולד צ'יפס", 'שוקולד', 'chocolate'], per100g: { cal: 546, protein: 4.9, carbs: 61, fat: 31 }, gPerCup: 170 },
  { names: ['וניל', 'vanilla'], per100g: { cal: 288, protein: 0, carbs: 13, fat: 0 }, gPerCup: 210 },
  { names: ['צימוקים', 'raisin'], per100g: { cal: 299, protein: 3, carbs: 79, fat: 0.5 }, gPerCup: 145 },
  { names: ['תמרים', 'תמר', 'date'], per100g: { cal: 277, protein: 1.8, carbs: 75, fat: 0.2 }, gPerUnit: 24, gPerCup: 150 },
  { names: ['אגוזי מלך', 'אגוז', 'walnut'], per100g: { cal: 654, protein: 15, carbs: 14, fat: 65 }, gPerCup: 100 },
  { names: ['שקדים', 'almond'], per100g: { cal: 579, protein: 21, carbs: 22, fat: 50 }, gPerCup: 95 },
  { names: ['בוטנים', 'peanut'], per100g: { cal: 567, protein: 26, carbs: 16, fat: 49 }, gPerCup: 146 },

  // --- fats, condiments, sweeteners ---
  { names: ['חמאת בוטנים', 'peanut butter'], per100g: { cal: 588, protein: 25, carbs: 20, fat: 50 }, gPerCup: 258 },
  { names: ['חמאה', 'butter'], per100g: { cal: 717, protein: 1, carbs: 0, fat: 81 }, gPerCup: 227 },
  { names: ['מרגרינה', 'margarine'], per100g: { cal: 717, protein: 0, carbs: 1, fat: 80 }, gPerCup: 227 },
  { names: ['שמן', 'oil'], per100g: { cal: 884, protein: 0, carbs: 0, fat: 100 }, gPerCup: 216 },
  { names: ['טחינה גולמית', 'טחינה', 'tahini'], per100g: { cal: 595, protein: 17, carbs: 21, fat: 54 }, gPerCup: 240 },
  { names: ['מיונז', 'mayo'], per100g: { cal: 680, protein: 1, carbs: 1, fat: 75 }, gPerCup: 220 },
  { names: ['דבש', 'honey'], per100g: { cal: 304, protein: 0.3, carbs: 82, fat: 0 }, gPerCup: 340 },
  { names: ['סילאן', 'silan'], per100g: { cal: 290, protein: 0.6, carbs: 75, fat: 0.2 }, gPerCup: 330 },
  { names: ['מייפל', 'maple'], per100g: { cal: 260, protein: 0, carbs: 67, fat: 0 }, gPerCup: 315 },
  { names: ['קטשופ', 'ketchup'], per100g: { cal: 112, protein: 1, carbs: 26, fat: 0.1 }, gPerCup: 245 },
  { names: ['חרדל', 'mustard'], per100g: { cal: 66, protein: 4, carbs: 6, fat: 4 }, gPerCup: 250 },
  { names: ['רסק עגבניות', 'tomato paste'], per100g: { cal: 82, protein: 4, carbs: 19, fat: 0.5 }, gPerCup: 260 },
  { names: ['פסטו', 'pesto'], per100g: { cal: 460, protein: 5, carbs: 6, fat: 47 }, gPerCup: 230 },

  // --- dairy & eggs ---
  { names: ['ביצים', 'ביצה', 'egg'], per100g: { cal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 }, gPerUnit: 55, gPerCup: 243 },
  { names: ['חלב קוקוס', 'coconut milk'], per100g: { cal: 230, protein: 2.3, carbs: 6, fat: 24 }, gPerCup: 240, gPerUnit: 400 },
  { names: ['חלב', 'milk'], per100g: { cal: 61, protein: 3.2, carbs: 4.8, fat: 3.3 }, gPerCup: 245 },
  { names: ['שמנת מתוקה', 'heavy cream', 'whipping cream'], per100g: { cal: 340, protein: 2.1, carbs: 2.8, fat: 36 }, gPerCup: 238 },
  { names: ['שמנת חמוצה', 'sour cream'], per100g: { cal: 198, protein: 2.4, carbs: 4.6, fat: 19 }, gPerCup: 230 },
  { names: ['שמנת', 'cream'], per100g: { cal: 195, protein: 2.8, carbs: 4, fat: 19 }, gPerCup: 240 },
  { names: ['יוגורט', 'yogurt', 'yoghurt'], per100g: { cal: 61, protein: 3.5, carbs: 4.7, fat: 3.3 }, gPerCup: 245 },
  { names: ['גבינת שמנת', 'cream cheese'], per100g: { cal: 342, protein: 6, carbs: 4, fat: 34 }, gPerCup: 232 },
  { names: ['קוטג', 'cottage'], per100g: { cal: 98, protein: 11, carbs: 3.4, fat: 4.3 }, gPerCup: 226 },
  { names: ['ריקוטה', 'ricotta'], per100g: { cal: 174, protein: 11, carbs: 3, fat: 13 }, gPerCup: 246 },
  { names: ['מסקרפונה', 'mascarpone'], per100g: { cal: 429, protein: 4.8, carbs: 4.8, fat: 44 }, gPerCup: 240 },
  { names: ['פרמזן', 'parmesan'], per100g: { cal: 431, protein: 38, carbs: 4, fat: 29 }, gPerCup: 100 },
  { names: ['מוצרלה', 'mozzarella'], per100g: { cal: 280, protein: 28, carbs: 3, fat: 17 }, gPerCup: 112 },
  { names: ['פטה', 'בולגרית', 'feta'], per100g: { cal: 264, protein: 14, carbs: 4, fat: 21 }, gPerCup: 150 },
  { names: ['גבינה צהובה', 'גבינה', 'cheese'], per100g: { cal: 350, protein: 25, carbs: 2, fat: 27 }, gPerCup: 113, gPerUnit: 20 },
  { names: ['לאבנה', 'לבנה', 'labneh'], per100g: { cal: 160, protein: 6, carbs: 5, fat: 13 }, gPerCup: 240 },

  // --- meat & fish ---
  { names: ['חזה עוף', 'chicken breast'], per100g: { cal: 165, protein: 31, carbs: 0, fat: 3.6 }, gPerUnit: 180 },
  { names: ['שוקיים', 'כרעיים', 'פרגיות', 'chicken thigh'], per100g: { cal: 209, protein: 26, carbs: 0, fat: 11 }, gPerUnit: 130 },
  { names: ['עוף', 'chicken'], per100g: { cal: 190, protein: 27, carbs: 0, fat: 8 }, gPerUnit: 150 },
  { names: ['הודו', 'turkey'], per100g: { cal: 189, protein: 29, carbs: 0, fat: 7 } },
  { names: ['בשר טחון', 'טחון', 'ground beef', 'mince'], per100g: { cal: 250, protein: 26, carbs: 0, fat: 15 } },
  { names: ['אנטריקוט', 'סטייק', 'בקר', 'beef', 'steak'], per100g: { cal: 250, protein: 26, carbs: 0, fat: 17 } },
  { names: ['כבש', 'טלה', 'lamb'], per100g: { cal: 294, protein: 25, carbs: 0, fat: 21 } },
  { names: ['נקניקיות', 'נקניק', 'sausage'], per100g: { cal: 300, protein: 12, carbs: 3, fat: 27 }, gPerUnit: 60 },
  { names: ['סלמון', 'salmon'], per100g: { cal: 208, protein: 20, carbs: 0, fat: 13 }, gPerUnit: 150 },
  { names: ['טונה', 'tuna'], per100g: { cal: 132, protein: 28, carbs: 0, fat: 1.3 }, gPerUnit: 160 },
  { names: ['שרימפס', 'shrimp'], per100g: { cal: 99, protein: 24, carbs: 0, fat: 0.3 } },
  { names: ['פילה דג', 'דג', 'fish'], per100g: { cal: 96, protein: 21, carbs: 0, fat: 1 }, gPerUnit: 150 },

  // --- produce ---
  { names: ['עגבניות מרוסקות', 'crushed tomato'], per100g: { cal: 32, protein: 1.6, carbs: 7, fat: 0.3 }, gPerCup: 240, gPerUnit: 400 },
  { names: ['עגבניות שרי', 'cherry tomato'], per100g: { cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, gPerCup: 150, gPerUnit: 15 },
  { names: ['עגבני', 'tomato'], per100g: { cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 }, gPerUnit: 120, gPerCup: 240 },
  { names: ['בצל ירוק', 'scallion', 'green onion'], per100g: { cal: 32, protein: 1.8, carbs: 7, fat: 0.2 }, gPerUnit: 15 },
  { names: ['בצל', 'onion'], per100g: { cal: 40, protein: 1.1, carbs: 9, fat: 0.1 }, gPerUnit: 110, gPerCup: 160 },
  { names: ['שום', 'garlic'], per100g: { cal: 149, protein: 6, carbs: 33, fat: 0.5 }, gPerUnit: 5, gPerCup: 136 },
  { names: ['גזר', 'carrot'], per100g: { cal: 41, protein: 0.9, carbs: 10, fat: 0.2 }, gPerUnit: 60, gPerCup: 128 },
  { names: ['תפוח אדמה', 'תפוחי אדמה', 'potato'], per100g: { cal: 77, protein: 2, carbs: 17, fat: 0.1 }, gPerUnit: 170 },
  { names: ['בטטה', 'sweet potato'], per100g: { cal: 86, protein: 1.6, carbs: 20, fat: 0.1 }, gPerUnit: 130 },
  { names: ['מלפפון', 'cucumber'], per100g: { cal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 }, gPerUnit: 100 },
  { names: ['פלפל', 'pepper', 'bell pepper'], per100g: { cal: 31, protein: 1, carbs: 6, fat: 0.3 }, gPerUnit: 120 },
  { names: ['קישוא', 'zucchini'], per100g: { cal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 }, gPerUnit: 195 },
  { names: ['חציל', 'eggplant'], per100g: { cal: 25, protein: 1, carbs: 6, fat: 0.2 }, gPerUnit: 450 },
  { names: ['פטריות', 'פטרי', 'mushroom'], per100g: { cal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 }, gPerCup: 70, gPerUnit: 18 },
  { names: ['תרד', 'spinach'], per100g: { cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, gPerCup: 30 },
  { names: ['חסה', 'lettuce'], per100g: { cal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 }, gPerCup: 47, gPerUnit: 300 },
  { names: ['כרובית', 'cauliflower'], per100g: { cal: 25, protein: 1.9, carbs: 5, fat: 0.3 }, gPerCup: 107, gPerUnit: 580 },
  { names: ['כרוב', 'cabbage'], per100g: { cal: 25, protein: 1.3, carbs: 6, fat: 0.1 }, gPerCup: 89, gPerUnit: 900 },
  { names: ['ברוקולי', 'broccoli'], per100g: { cal: 34, protein: 2.8, carbs: 7, fat: 0.4 }, gPerCup: 90, gPerUnit: 300 },
  { names: ['סלרי', 'celery'], per100g: { cal: 16, protein: 0.7, carbs: 3, fat: 0.2 }, gPerUnit: 40 },
  { names: ['אבוקדו', 'avocado'], per100g: { cal: 160, protein: 2, carbs: 9, fat: 15 }, gPerUnit: 200 },
  { names: ['בננה', 'banana'], per100g: { cal: 89, protein: 1.1, carbs: 23, fat: 0.3 }, gPerUnit: 118 },
  { names: ['תפוח', 'apple'], per100g: { cal: 52, protein: 0.3, carbs: 14, fat: 0.2 }, gPerUnit: 180 },
  { names: ['מיץ לימון', 'lemon juice'], per100g: { cal: 22, protein: 0.4, carbs: 7, fat: 0 }, gPerCup: 244 },
  { names: ['לימון', 'lemon', 'ליים', 'lime'], per100g: { cal: 29, protein: 1.1, carbs: 9, fat: 0.3 }, gPerUnit: 60 },
  { names: ['תפוז', 'orange'], per100g: { cal: 47, protein: 0.9, carbs: 12, fat: 0.1 }, gPerUnit: 130 },
  { names: ['רימון', 'pomegranate'], per100g: { cal: 83, protein: 1.7, carbs: 19, fat: 1.2 }, gPerUnit: 280 },
  { names: ['מנגו', 'mango'], per100g: { cal: 60, protein: 0.8, carbs: 15, fat: 0.4 }, gPerUnit: 200 },
  { names: ['תות', 'strawberr'], per100g: { cal: 32, protein: 0.7, carbs: 8, fat: 0.3 }, gPerCup: 150 },
  { names: ['ענבים', 'grape'], per100g: { cal: 69, protein: 0.7, carbs: 18, fat: 0.2 }, gPerCup: 150 },
  { names: ['תירס', 'corn'], per100g: { cal: 86, protein: 3.3, carbs: 19, fat: 1.4 }, gPerCup: 165, gPerUnit: 300 },
  { names: ['אפונה', 'peas'], per100g: { cal: 81, protein: 5, carbs: 14, fat: 0.4 }, gPerCup: 145 },
  { names: ['שעועית ירוקה', 'green bean'], per100g: { cal: 31, protein: 1.8, carbs: 7, fat: 0.2 }, gPerCup: 100 },
  { names: ['שעועית', 'bean'], per100g: { cal: 337, protein: 21, carbs: 62, fat: 1 }, gPerCup: 200, gPerUnit: 400 },
  { names: ['זיתים', 'olive'], per100g: { cal: 115, protein: 0.8, carbs: 6, fat: 11 }, gPerCup: 135 },

  // --- herbs & spices (tiny but non-zero) ---
  { names: ['פטרוזיליה', 'כוסברה', 'שמיר', 'בזיליקום', 'נענע', 'parsley', 'cilantro', 'dill', 'basil', 'mint'], per100g: { cal: 36, protein: 3, carbs: 6, fat: 0.7 }, gPerCup: 60, gPerUnit: 50 },
  { names: ["ג'ינג'ר", 'זנגביל', 'ginger'], per100g: { cal: 80, protein: 1.8, carbs: 18, fat: 0.8 }, gPerUnit: 15 },
  { names: ['פפריקה', 'כמון', 'כורכום', 'קינמון', 'זעתר', 'אורגנו', 'הל', 'תבלין', 'paprika', 'cumin', 'turmeric', 'cinnamon', 'oregano', 'spice', 'curry'], per100g: { cal: 300, protein: 12, carbs: 50, fat: 12 }, gPerCup: 110 },
  { names: ['שומשום', 'sesame'], per100g: { cal: 573, protein: 18, carbs: 23, fat: 50 }, gPerCup: 144 },

  // --- bread & misc ---
  { names: ['לחם', 'bread'], per100g: { cal: 265, protein: 9, carbs: 49, fat: 3 }, gPerUnit: 30 },
  { names: ['פיתה', 'pita'], per100g: { cal: 275, protein: 9, carbs: 55, fat: 1.2 }, gPerUnit: 60 },
  { names: ['טורטיה', 'tortilla'], per100g: { cal: 310, protein: 8, carbs: 52, fat: 8 }, gPerUnit: 45 },
  { names: ['סויה', 'soy sauce'], per100g: { cal: 53, protein: 8, carbs: 5, fat: 0.6 }, gPerCup: 255 },
  { names: ['חומץ', 'vinegar'], per100g: { cal: 18, protein: 0, carbs: 0.9, fat: 0 }, gPerCup: 240 },
  { names: ['יין', 'wine'], per100g: { cal: 83, protein: 0, carbs: 2.6, fat: 0 }, gPerCup: 240 },
  { names: ['ציר', 'מרק עוף', 'broth', 'stock'], per100g: { cal: 5, protein: 0.5, carbs: 0.5, fat: 0.1 }, gPerCup: 240 },
];

/**
 * Near-zero-calorie names: lines that match these count as "covered" with 0
 * kcal even when no quantity was parsed ("מלח ופלפל שחור לפי הטעם").
 */
export const ZERO_CAL_NAMES = ['מלח', 'salt', 'מים', 'water', 'פלפל שחור', 'black pepper', 'קרח', 'ice', 'סודה לשתיה', 'baking soda'];

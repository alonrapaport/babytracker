// Curated tag ids, grouped the way ReciMe categorizes recipes (meal type,
// cuisine, diet, category). Stored on recipes as plain strings; ids listed
// here get localized chip labels (i18n key `tag_<id>`), anything else renders
// as free text.
export const TAG_GROUPS: { group: string; tags: string[] }[] = [
  { group: 'meal', tags: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] },
  { group: 'cuisine', tags: ['israeli', 'italian', 'asian', 'mexican', 'indian', 'french', 'mediterranean', 'american'] },
  { group: 'diet', tags: ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'healthy'] },
  { group: 'category', tags: ['quick', 'budget', 'family', 'holiday', 'baking', 'soup', 'salad'] },
];

export const KNOWN_TAGS = new Set(TAG_GROUPS.flatMap((g) => g.tags));

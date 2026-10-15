export type StoreCategory = {
  id: string;
  slug: string;
  name: string;
  family: string | null;
};

const cuisineTerms = [
  "american",
  "brazilian",
  "chinese",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "mediterranean",
  "mexican",
  "spanish",
  "thai",
  "turkish",
  "vegan",
  "vietnamese",
  "middle eastern",
];

const turkishCharacterMap: Record<string, string> = {
  ı: "i",
  İ: "i",
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ş: "s",
  Ş: "s",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

export function normalized(value: string) {
  return value
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (character) => turkishCharacterMap[character] ?? character)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function categoryText(category: StoreCategory) {
  return normalized(`${category.slug} ${category.name}`);
}

export function premiumCategoryLabel(category: StoreCategory) {
  const slug = normalized(category.slug);
  const name = normalized(category.name);
  const text = `${slug} ${name}`;

  if (/boat tour|boat rental|yacht|yat|tekne|charter|sailing/.test(text)) return "Yacht Luxury Travel";
  if (slug === "luxury travel") return "Luxury Travel";
  if (/travel agency|travel company|travel service|tour agency|tour guide|sightseeing/.test(text)) return "Private Travel & Tours";
  if (/hotel|resort|villa/.test(text)) return "Luxury Stay Experience";
  if (/restaurant|dining|food|cafe|bakery/.test(text)) return "Dining & Food Experience";
  if (/fashion|style|boutique|jewelry|watch/.test(text)) return "Style & Luxury Retail";
  if (/beauty|makeup|skin|hair|spa|salon/.test(text)) return "Beauty & Self-Care";

  return category.name;
}

export function categorySearchAliases(category: StoreCategory) {
  const text = categoryText(category);
  const aliases: string[] = [];

  if (/boat|yacht|sailing|charter|ferry/.test(text)) {
    aliases.push(
      "yat",
      "yatch",
      "yacht",
      "tekne",
      "tekne turu",
      "yat turu",
      "yat kiralama",
      "tekne kiralama",
      "ozel yat",
      "ozel tekne",
      "mavi tur",
      "gulet",
      "sunset cruise",
      "private yacht charter",
      "luxury yacht travel",
      "boat tour",
      "boat rental",
      "sailing tour",
    );
  }

  if (/travel|tour|tourism|sightseeing|hotel|resort/.test(text)) {
    aliases.push("tur", "gezi", "seyahat", "tatil", "rota", "luxury travel", "private tour", "travel reels");
  }

  if (/restaurant|food|cafe|bakery|dining/.test(text)) {
    aliases.push("restoran", "yemek", "kafe", "kahve", "menu", "dining", "food reels");
  }

  if (/beauty|makeup|skin|hair|spa|salon/.test(text)) {
    aliases.push("guzellik", "makyaj", "cilt", "sac", "bakim", "beauty reels");
  }

  if (/fashion|style|boutique|jewelry|watch|outfit/.test(text)) {
    aliases.push("moda", "stil", "kombin", "butik", "taki", "saat", "luxury fashion");
  }

  return aliases.map(normalized);
}

export function categorySearchText(category: StoreCategory) {
  return normalized([category.slug, category.name, premiumCategoryLabel(category), ...categorySearchAliases(category)].join(" "));
}

export function cuisineFromQuery(query: string) {
  const text = normalized(query);
  return cuisineTerms.find((term) => text.includes(term)) ?? "";
}

export function isCanonicalRestaurant(category: StoreCategory) {
  const slug = normalized(category.slug);
  const name = normalized(category.name);
  return slug === "restaurant" || name === "restaurant";
}

export function isCuisineSpecificRestaurant(category: StoreCategory) {
  const text = categoryText(category);
  if (!text.includes("restaurant")) return false;
  return cuisineTerms.some((term) => text.includes(`${term} restaurant`));
}

export function categoryBucket(category: StoreCategory) {
  const text = categoryText(category);
  if (/beauty|makeup|skin|hair|salon|cosmetic|spa|nail|lash|brow|fragrance/.test(text)) return "beauty";
  if (/fashion|style|clothing|jewelry|watch|shoe|boutique|streetwear|luxury|outfit/.test(text)) return "fashion";
  if (/food|restaurant|cafe|bakery|coffee|pizza|kitchen|dessert|tea|recipe|cooking|dining|bar|sushi|brunch/.test(text)) return "food";
  if (/travel|hotel|tour|tourism|resort|city|museum|park|venue|nomad|rv|van life|boat|yacht|charter|sailing/.test(text)) return "travel";
  if (/fitness|sports|athlete|running|marathon|pilates|yoga|workout|wellness/.test(text)) return "lifestyle";
  if (/education|school|course|coach|training|author|book|tutorial|science|tech|learning/.test(text)) return "education";
  if (/entertainment|comedy|music|artist|theater|film|cinema|gaming|creator|podcast|dance/.test(text)) return "entertainment";
  if (/shop|store|commerce|product|retail|affiliate|market|supply|ecommerce|brand/.test(text)) return "commerce";
  return category.family === "instagram_business" ? "business" : "creator";
}

export function categorySearchScore(category: StoreCategory, query: string, cuisineQuery = "", restaurantSlug?: string) {
  const needle = normalized(query);
  if (!needle) return 0;
  const label = normalized(premiumCategoryLabel(category));
  const slug = normalized(category.slug);
  const haystack = categorySearchText(category);
  const aliases = categorySearchAliases(category);
  let score = 0;

  if (label === needle || slug === needle) score += 120;
  if (label.includes(needle)) score += 80;
  if (aliases.some((alias) => alias === needle)) score += 100;
  if (aliases.some((alias) => alias.includes(needle) || needle.includes(alias))) score += 70;
  if (haystack.includes(needle)) score += 35;
  if (/\b(yat|yatch|yacht|tekne|gulet|charter|mavi tur)\b/.test(needle) && label === "yacht luxury travel") score += 160;
  if (cuisineQuery && restaurantSlug === category.slug) score += 90;

  return score;
}

export function filterStoreCategories(
  categories: StoreCategory[],
  query: string,
  filter: string,
  cuisineQuery = cuisineFromQuery(query),
  restaurantSlug?: string,
) {
  const needle = normalized(query.trim());

  return categories
    .filter((category) => {
      if (isCuisineSpecificRestaurant(category)) return false;
      const bucket = categoryBucket(category);
      const isCuisineRestaurantMatch = Boolean(cuisineQuery && restaurantSlug === category.slug);
      const haystack = categorySearchText(category);
      return (!needle || haystack.includes(needle) || isCuisineRestaurantMatch) && (filter === "all" || bucket === filter || isCuisineRestaurantMatch);
    })
    .sort((left, right) => categorySearchScore(right, query, cuisineQuery, restaurantSlug) - categorySearchScore(left, query, cuisineQuery, restaurantSlug));
}
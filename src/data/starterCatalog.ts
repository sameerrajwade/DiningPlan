import { CuisineTag, Diet } from '../types';

// A dish category, used to keep a seeded starter set balanced (not 50 mains).
export type DishCategory =
  | 'main'
  | 'side'
  | 'bread'
  | 'rice'
  | 'breakfast'
  | 'snack'
  | 'sweet';

// One entry in the global starter catalog. `cuisineTag` stays BROAD (Indian,
// Italian, …) so Insights/planner cuisine-variety logic never fragments; the
// finer `region` is catalog-only metadata (also stored in a seeded dish's
// categoryTags[] for display). `weight` biases the starter picker toward
// household staples (3 = everyday, 1 = occasional/special).
export interface CatalogEntry {
  continent: string;
  country: string;
  region: string;
  name: string;
  cuisineTag: CuisineTag;
  diet: Diet;
  category: DishCategory;
  ingredients?: string[];
  weight?: number; // 1..3, default 2
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase-1 content. Deep in the primary market (India regions) + a spread of top
// world cuisines. Every future region/country is a pure array addition here —
// no code change. Ingredients are the few staples a shopper actually buys, so
// the grocery list is one tap for common dishes.
// ─────────────────────────────────────────────────────────────────────────────

const INDIA: CatalogEntry[] = [
  // Punjabi
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Rajma Chawal', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['rajma', 'onion', 'tomato', 'ginger-garlic', 'rice'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Chole Bhature', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['chickpeas', 'flour', 'onion', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Dal Makhani', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['black dal', 'rajma', 'butter', 'cream', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Butter Chicken', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'tomato', 'butter', 'cream'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Palak Paneer', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['spinach', 'paneer', 'onion', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Sarson da Saag', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['mustard greens', 'spinach', 'maize flour'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Aloo Paratha', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['potato', 'wheat flour', 'butter'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Chicken Tikka Masala', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'yogurt', 'tomato', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Paneer Tikka', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['paneer', 'yogurt', 'bell pepper', 'onion'] },

  // Gujarati
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Dhokla', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 3, ingredients: ['gram flour', 'yogurt', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Undhiyu', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['surti beans', 'eggplant', 'potato', 'yam'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Thepla', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['wheat flour', 'fenugreek leaves', 'yogurt'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Khandvi', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['gram flour', 'yogurt', 'mustard seeds'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Gujarati Kadhi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['yogurt', 'gram flour', 'jaggery'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Gujarati Dal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['toor dal', 'jaggery', 'tomato', 'peanuts'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Handvo', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['rice', 'lentils', 'bottle gourd', 'yogurt'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Shrikhand', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['hung yogurt', 'sugar', 'cardamom', 'saffron'] },

  // Maharashtrian
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Poha', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['flattened rice', 'onion', 'potato', 'peanuts'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Misal Pav', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['moth beans', 'pav', 'onion', 'farsan'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Puran Poli', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['chana dal', 'jaggery', 'wheat flour'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Pithla Bhakri', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['gram flour', 'onion', 'jowar flour'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Vada Pav', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 3, ingredients: ['potato', 'pav', 'gram flour', 'garlic chutney'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Sabudana Khichdi', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['sabudana', 'peanuts', 'potato'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Thalipeeth', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['multigrain flour', 'onion', 'spices'] },

  // South Indian
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Idli', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['rice', 'urad dal'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Masala Dosa', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['rice', 'urad dal', 'potato', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Sambar', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['toor dal', 'tamarind', 'mixed vegetables', 'sambar powder'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Medu Vada', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['urad dal', 'green chilli', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Upma', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['semolina', 'onion', 'mustard seeds'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Rasam', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['tamarind', 'tomato', 'rasam powder'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Bisi Bele Bath', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['rice', 'toor dal', 'vegetables', 'tamarind'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Curd Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'yogurt', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Lemon Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'lemon', 'peanuts', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Hyderabadi Biryani', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['basmati rice', 'chicken', 'yogurt', 'fried onion'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Coconut Chutney', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['coconut', 'green chilli', 'chana dal'] },

  // Bengali
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Macher Jhol', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['fish', 'potato', 'tomato', 'turmeric'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Shorshe Ilish', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['hilsa fish', 'mustard paste', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Aloo Posto', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['potato', 'poppy seeds', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Cholar Dal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['bengal gram', 'coconut', 'raisins'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Luchi', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 2, ingredients: ['refined flour', 'oil'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Kosha Mangsho', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['mutton', 'onion', 'yogurt', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Mishti Doi', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['yogurt', 'jaggery'] },

  // Pan-Indian staples (breads, rice, everyday dals & sabzis)
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Roti', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 3, ingredients: ['wheat flour'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Jeera Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 3, ingredients: ['rice', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Dal Tadka', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['toor dal', 'garlic', 'tomato', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Paneer Butter Masala', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['paneer', 'tomato', 'butter', 'cream'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Chana Masala', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['chickpeas', 'onion', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Aloo Gobi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['potato', 'cauliflower', 'turmeric'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Bhindi Masala', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['okra', 'onion', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Egg Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['eggs', 'onion', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Chicken Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['chicken', 'onion', 'tomato', 'ginger-garlic'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Raita', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['yogurt', 'cucumber', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Pulao', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 3, ingredients: ['basmati rice', 'mixed vegetables', 'whole spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Biryani', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 3, ingredients: ['basmati rice', 'mixed vegetables', 'yogurt', 'fried onion'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Kadhi Chawal', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['yogurt', 'gram flour', 'rice'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Masoor Dal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['red lentils', 'onion', 'tomato', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Aloo Matar', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['potato', 'peas', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Mixed Veg Sabzi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['mixed vegetables', 'onion', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Paratha', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 3, ingredients: ['wheat flour', 'oil'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Naan', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 2, ingredients: ['refined flour', 'yogurt', 'yeast'] },

  // Rajasthani
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Dal Baati Churma', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['wheat flour', 'toor dal', 'ghee', 'jaggery'] },
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Gatte ki Sabzi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['gram flour', 'yogurt', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Ker Sangri', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['ker berries', 'sangri beans', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Laal Maas', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['mutton', 'red chilli', 'yogurt', 'garlic'] },

  // Kashmiri
  { continent: 'Asia', country: 'India', region: 'Kashmiri', name: 'Rogan Josh', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['mutton', 'yogurt', 'kashmiri chilli', 'fennel'] },
  { continent: 'Asia', country: 'India', region: 'Kashmiri', name: 'Dum Aloo', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['baby potato', 'yogurt', 'kashmiri chilli'] },
  { continent: 'Asia', country: 'India', region: 'Kashmiri', name: 'Nadru Yakhni', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['lotus stem', 'yogurt', 'fennel'] },

  // Goan
  { continent: 'Asia', country: 'India', region: 'Goan', name: 'Goan Fish Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['fish', 'coconut', 'tamarind', 'red chilli'] },
  { continent: 'Asia', country: 'India', region: 'Goan', name: 'Chicken Xacuti', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['chicken', 'coconut', 'poppy seeds', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Goan', name: 'Prawn Balchao', cuisineTag: 'Indian', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['prawns', 'red chilli', 'vinegar', 'garlic'] },

  // Kerala
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Appam with Stew', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['rice', 'coconut milk', 'vegetables'] },
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Kerala Fish Molee', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['fish', 'coconut milk', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Avial', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['mixed vegetables', 'coconut', 'yogurt', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Puttu and Kadala', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['rice flour', 'coconut', 'black chickpeas'] },

  // Andhra / Chettinad
  { continent: 'Asia', country: 'India', region: 'Andhra', name: 'Gongura Pachadi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['sorrel leaves', 'red chilli', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Andhra', name: 'Andhra Chicken Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'red chilli', 'onion', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'Chettinad', name: 'Chettinad Chicken', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'coconut', 'peppercorn', 'fennel'] },
  { continent: 'Asia', country: 'India', region: 'Chettinad', name: 'Kara Kuzhambu', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['tamarind', 'shallots', 'spices'] },

  // Awadhi / Mughlai
  { continent: 'Asia', country: 'India', region: 'Awadhi', name: 'Chicken Biryani', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['basmati rice', 'chicken', 'yogurt', 'fried onion'] },
  { continent: 'Asia', country: 'India', region: 'Awadhi', name: 'Galouti Kebab', cuisineTag: 'Indian', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['minced mutton', 'spices', 'ghee'] },
  { continent: 'Asia', country: 'India', region: 'Awadhi', name: 'Shahi Paneer', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['paneer', 'cashew', 'cream', 'tomato'] },
  { continent: 'Asia', country: 'India', region: 'Awadhi', name: 'Seekh Kebab', cuisineTag: 'Indian', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['minced meat', 'onion', 'spices'] },
];

const GLOBAL: CatalogEntry[] = [
  // Chinese (incl. Indo-Chinese)
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Veg Fried Rice', cuisineTag: 'Chinese', diet: 'veg', category: 'rice', weight: 3, ingredients: ['rice', 'mixed vegetables', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Hakka Noodles', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 3, ingredients: ['noodles', 'cabbage', 'bell pepper', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Chilli Paneer', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 2, ingredients: ['paneer', 'bell pepper', 'onion', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Veg Manchurian', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 2, ingredients: ['cabbage', 'carrot', 'cornflour', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Kung Pao Chicken', cuisineTag: 'Chinese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'peanuts', 'bell pepper', 'chilli'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Schezwan Noodles', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 2, ingredients: ['noodles', 'schezwan sauce', 'vegetables'] },

  // Italian
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Pasta Marinara', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 3, ingredients: ['pasta', 'tomato', 'garlic', 'basil'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Margherita Pizza', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 3, ingredients: ['pizza base', 'mozzarella', 'tomato', 'basil'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Spaghetti Aglio e Olio', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 2, ingredients: ['spaghetti', 'garlic', 'olive oil', 'chilli flakes'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Penne Arrabbiata', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 2, ingredients: ['penne', 'tomato', 'garlic', 'chilli'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Pasta Alfredo', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 2, ingredients: ['pasta', 'cream', 'butter', 'parmesan'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Lasagna', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 1, ingredients: ['lasagna sheets', 'tomato', 'cheese', 'bechamel'] },

  // Mexican
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Tacos', cuisineTag: 'Mexican', diet: 'veg', category: 'main', weight: 3, ingredients: ['tortilla', 'beans', 'lettuce', 'salsa'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Burrito', cuisineTag: 'Mexican', diet: 'veg', category: 'main', weight: 3, ingredients: ['tortilla', 'rice', 'beans', 'cheese'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Quesadilla', cuisineTag: 'Mexican', diet: 'veg', category: 'snack', weight: 2, ingredients: ['tortilla', 'cheese', 'bell pepper'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Guacamole', cuisineTag: 'Mexican', diet: 'veg', category: 'side', weight: 2, ingredients: ['avocado', 'onion', 'lime', 'cilantro'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Rice and Beans', cuisineTag: 'Mexican', diet: 'veg', category: 'main', weight: 2, ingredients: ['rice', 'black beans', 'onion'] },

  // American
  { continent: 'North America', country: 'USA', region: 'American', name: 'Grilled Cheese', cuisineTag: 'American', diet: 'veg', category: 'snack', weight: 2, ingredients: ['bread', 'cheese', 'butter'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Veggie Burger', cuisineTag: 'American', diet: 'veg', category: 'main', weight: 2, ingredients: ['burger bun', 'patty', 'lettuce', 'tomato'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Mac and Cheese', cuisineTag: 'American', diet: 'veg', category: 'main', weight: 2, ingredients: ['macaroni', 'cheese', 'milk', 'butter'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Pancakes', cuisineTag: 'American', diet: 'veg', category: 'breakfast', weight: 3, ingredients: ['flour', 'milk', 'egg', 'maple syrup'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Scrambled Eggs', cuisineTag: 'American', diet: 'nonveg', category: 'breakfast', weight: 3, ingredients: ['eggs', 'butter', 'milk'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Caesar Salad', cuisineTag: 'American', diet: 'veg', category: 'side', weight: 2, ingredients: ['romaine lettuce', 'croutons', 'parmesan', 'caesar dressing'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'BBQ Chicken', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'bbq sauce'] },

  // Thai
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Pad Thai', cuisineTag: 'Thai', diet: 'veg', category: 'main', weight: 3, ingredients: ['rice noodles', 'peanuts', 'tofu', 'tamarind'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Thai Green Curry', cuisineTag: 'Thai', diet: 'veg', category: 'main', weight: 2, ingredients: ['green curry paste', 'coconut milk', 'vegetables'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Thai Fried Rice', cuisineTag: 'Thai', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'egg', 'vegetables', 'fish sauce'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Tom Yum Soup', cuisineTag: 'Thai', diet: 'veg', category: 'side', weight: 1, ingredients: ['lemongrass', 'galangal', 'mushroom', 'lime'] },

  // Middle Eastern
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Hummus', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'side', weight: 2, ingredients: ['chickpeas', 'tahini', 'garlic', 'lemon'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Falafel', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'snack', weight: 2, ingredients: ['chickpeas', 'herbs', 'garlic'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Chicken Shawarma', cuisineTag: 'Middle Eastern', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'yogurt', 'pita', 'garlic sauce'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Tabbouleh', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'side', weight: 1, ingredients: ['bulgur', 'parsley', 'tomato', 'lemon'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Shakshuka', cuisineTag: 'Middle Eastern', diet: 'nonveg', category: 'breakfast', weight: 2, ingredients: ['eggs', 'tomato', 'bell pepper', 'onion'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Baba Ganoush', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'side', weight: 1, ingredients: ['eggplant', 'tahini', 'garlic', 'lemon'] },

  // Chinese regional depth
  { continent: 'Asia', country: 'China', region: 'Sichuan', name: 'Mapo Tofu', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 2, ingredients: ['tofu', 'doubanjiang', 'sichuan pepper', 'spring onion'] },
  { continent: 'Asia', country: 'China', region: 'Sichuan', name: 'Dan Dan Noodles', cuisineTag: 'Chinese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['noodles', 'minced pork', 'chilli oil', 'sichuan pepper'] },
  { continent: 'Asia', country: 'China', region: 'Cantonese', name: 'Dim Sum', cuisineTag: 'Chinese', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['flour', 'prawns', 'pork', 'chives'] },
  { continent: 'Asia', country: 'China', region: 'Cantonese', name: 'Sweet and Sour Chicken', cuisineTag: 'Chinese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'pineapple', 'bell pepper', 'vinegar'] },
  { continent: 'Asia', country: 'China', region: 'Cantonese', name: 'Congee', cuisineTag: 'Chinese', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['rice', 'ginger', 'spring onion'] },

  // Italian regional depth
  { continent: 'Europe', country: 'Italy', region: 'Roman', name: 'Spaghetti Carbonara', cuisineTag: 'Italian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['spaghetti', 'egg', 'pancetta', 'parmesan'] },
  { continent: 'Europe', country: 'Italy', region: 'Roman', name: 'Cacio e Pepe', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 1, ingredients: ['pasta', 'pecorino', 'black pepper'] },
  { continent: 'Europe', country: 'Italy', region: 'Northern Italian', name: 'Risotto', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 2, ingredients: ['arborio rice', 'parmesan', 'butter', 'stock'] },
  { continent: 'Europe', country: 'Italy', region: 'Northern Italian', name: 'Minestrone', cuisineTag: 'Italian', diet: 'veg', category: 'side', weight: 1, ingredients: ['mixed vegetables', 'beans', 'pasta', 'tomato'] },

  // Mexican regional depth
  { continent: 'North America', country: 'Mexico', region: 'Northern Mexican', name: 'Enchiladas', cuisineTag: 'Mexican', diet: 'veg', category: 'main', weight: 2, ingredients: ['tortilla', 'cheese', 'enchilada sauce', 'beans'] },
  { continent: 'North America', country: 'Mexico', region: 'Northern Mexican', name: 'Fajitas', cuisineTag: 'Mexican', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'bell pepper', 'onion', 'tortilla'] },
  { continent: 'North America', country: 'Mexico', region: 'Southern Mexican', name: 'Chilaquiles', cuisineTag: 'Mexican', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['tortilla chips', 'salsa', 'cheese', 'egg'] },
  { continent: 'North America', country: 'Mexico', region: 'Southern Mexican', name: 'Elote', cuisineTag: 'Mexican', diet: 'veg', category: 'snack', weight: 1, ingredients: ['corn', 'mayo', 'cotija', 'chilli powder'] },

  // American regional depth
  { continent: 'North America', country: 'USA', region: 'Tex-Mex', name: 'Chili con Carne', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['minced beef', 'kidney beans', 'tomato', 'chilli'] },
  { continent: 'North America', country: 'USA', region: 'Southern', name: 'Fried Chicken', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'flour', 'buttermilk', 'spices'] },
  { continent: 'North America', country: 'USA', region: 'Southern', name: 'Cornbread', cuisineTag: 'American', diet: 'veg', category: 'bread', weight: 1, ingredients: ['cornmeal', 'flour', 'milk', 'egg'] },

  // Japanese
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Chicken Teriyaki', cuisineTag: 'Japanese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'soy sauce', 'mirin', 'sugar'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Vegetable Ramen', cuisineTag: 'Japanese', diet: 'veg', category: 'main', weight: 2, ingredients: ['ramen noodles', 'miso', 'vegetables', 'egg'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Miso Soup', cuisineTag: 'Japanese', diet: 'veg', category: 'side', weight: 2, ingredients: ['miso', 'tofu', 'seaweed', 'spring onion'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Chicken Katsu', cuisineTag: 'Japanese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'panko', 'tonkatsu sauce'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Onigiri', cuisineTag: 'Japanese', diet: 'veg', category: 'snack', weight: 1, ingredients: ['rice', 'nori', 'fillings'] },

  // Korean
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Bibimbap', cuisineTag: 'Korean', diet: 'veg', category: 'main', weight: 2, ingredients: ['rice', 'vegetables', 'gochujang', 'egg'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Kimchi Fried Rice', cuisineTag: 'Korean', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'kimchi', 'gochujang', 'egg'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Bulgogi', cuisineTag: 'Korean', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'soy sauce', 'pear', 'sesame oil'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Japchae', cuisineTag: 'Korean', diet: 'veg', category: 'main', weight: 1, ingredients: ['glass noodles', 'vegetables', 'soy sauce', 'sesame'] },

  // Vietnamese
  { continent: 'Asia', country: 'Vietnam', region: 'Vietnamese', name: 'Pho', cuisineTag: 'Vietnamese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['rice noodles', 'beef', 'broth', 'herbs'] },
  { continent: 'Asia', country: 'Vietnam', region: 'Vietnamese', name: 'Banh Mi', cuisineTag: 'Vietnamese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['baguette', 'pork', 'pickled vegetables', 'cilantro'] },
  { continent: 'Asia', country: 'Vietnam', region: 'Vietnamese', name: 'Fresh Spring Rolls', cuisineTag: 'Vietnamese', diet: 'veg', category: 'snack', weight: 1, ingredients: ['rice paper', 'vegetables', 'herbs', 'peanut sauce'] },

  // Greek
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Greek Salad', cuisineTag: 'Greek', diet: 'veg', category: 'side', weight: 2, ingredients: ['cucumber', 'tomato', 'feta', 'olives'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Chicken Souvlaki', cuisineTag: 'Greek', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'lemon', 'oregano', 'garlic'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Moussaka', cuisineTag: 'Greek', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['eggplant', 'minced lamb', 'bechamel', 'tomato'] },

  // Spanish
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Paella', cuisineTag: 'Spanish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['rice', 'seafood', 'saffron', 'peas'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Spanish Tortilla', cuisineTag: 'Spanish', diet: 'nonveg', category: 'breakfast', weight: 1, ingredients: ['potato', 'egg', 'onion', 'olive oil'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Patatas Bravas', cuisineTag: 'Spanish', diet: 'veg', category: 'snack', weight: 1, ingredients: ['potato', 'tomato', 'paprika', 'aioli'] },

  // Pakistani
  { continent: 'Asia', country: 'Pakistan', region: 'Pakistani', name: 'Nihari', cuisineTag: 'Pakistani', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'wheat flour', 'ginger', 'spices'] },
  { continent: 'Asia', country: 'Pakistan', region: 'Pakistani', name: 'Chicken Karahi', cuisineTag: 'Pakistani', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'tomato', 'ginger', 'green chilli'] },
  { continent: 'Asia', country: 'Pakistan', region: 'Pakistani', name: 'Haleem', cuisineTag: 'Pakistani', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['wheat', 'lentils', 'meat', 'spices'] },
  { continent: 'Asia', country: 'Pakistan', region: 'Pakistani', name: 'Aloo Keema', cuisineTag: 'Pakistani', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['minced meat', 'potato', 'onion', 'tomato'] },

  // Sri Lankan
  { continent: 'Asia', country: 'Sri Lanka', region: 'Sri Lankan', name: 'Rice and Curry', cuisineTag: 'Sri Lankan', diet: 'veg', category: 'main', weight: 2, ingredients: ['rice', 'dal', 'coconut', 'vegetables'] },
  { continent: 'Asia', country: 'Sri Lanka', region: 'Sri Lankan', name: 'Kottu Roti', cuisineTag: 'Sri Lankan', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['godhamba roti', 'egg', 'vegetables', 'curry'] },
  { continent: 'Asia', country: 'Sri Lanka', region: 'Sri Lankan', name: 'Egg Hoppers', cuisineTag: 'Sri Lankan', diet: 'nonveg', category: 'breakfast', weight: 1, ingredients: ['rice flour', 'coconut milk', 'egg'] },

  // British
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Fish and Chips', cuisineTag: 'British', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['fish', 'potato', 'batter', 'peas'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Shepherd’s Pie', cuisineTag: 'British', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced lamb', 'potato', 'peas', 'carrot'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Beans on Toast', cuisineTag: 'British', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['bread', 'baked beans', 'butter'] },

  // French
  { continent: 'Europe', country: 'France', region: 'French', name: 'Ratatouille', cuisineTag: 'French', diet: 'veg', category: 'main', weight: 1, ingredients: ['eggplant', 'zucchini', 'tomato', 'bell pepper'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Croissant', cuisineTag: 'French', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['flour', 'butter', 'yeast'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Quiche', cuisineTag: 'French', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['pastry', 'egg', 'cream', 'cheese'] },

  // Indonesian / Filipino
  { continent: 'Asia', country: 'Indonesia', region: 'Indonesian', name: 'Nasi Goreng', cuisineTag: 'Indonesian', diet: 'nonveg', category: 'rice', weight: 2, ingredients: ['rice', 'egg', 'kecap manis', 'chicken'] },
  { continent: 'Asia', country: 'Indonesia', region: 'Indonesian', name: 'Gado Gado', cuisineTag: 'Indonesian', diet: 'veg', category: 'main', weight: 1, ingredients: ['mixed vegetables', 'peanut sauce', 'egg', 'tofu'] },
  { continent: 'Asia', country: 'Philippines', region: 'Filipino', name: 'Chicken Adobo', cuisineTag: 'Filipino', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'soy sauce', 'vinegar', 'garlic'] },
  { continent: 'Asia', country: 'Philippines', region: 'Filipino', name: 'Pancit', cuisineTag: 'Filipino', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['rice noodles', 'vegetables', 'chicken', 'soy sauce'] },

  // Ethiopian / Nigerian
  { continent: 'Africa', country: 'Ethiopia', region: 'Ethiopian', name: 'Injera with Doro Wat', cuisineTag: 'Ethiopian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['teff flour', 'chicken', 'berbere', 'egg'] },
  { continent: 'Africa', country: 'Ethiopia', region: 'Ethiopian', name: 'Misir Wat', cuisineTag: 'Ethiopian', diet: 'veg', category: 'side', weight: 1, ingredients: ['red lentils', 'berbere', 'onion'] },
  { continent: 'Africa', country: 'Nigeria', region: 'Nigerian', name: 'Jollof Rice', cuisineTag: 'Nigerian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'tomato', 'pepper', 'onion'] },
  { continent: 'Africa', country: 'Nigeria', region: 'Nigerian', name: 'Egusi Soup', cuisineTag: 'Nigerian', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['melon seeds', 'spinach', 'meat', 'palm oil'] },

  // ── Europe ──────────────────────────────────────────────────────────────
  // German
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Bratwurst', cuisineTag: 'German', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['pork sausage', 'mustard', 'bread roll'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Schnitzel', cuisineTag: 'German', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['pork', 'breadcrumbs', 'egg', 'lemon'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Spätzle', cuisineTag: 'German', diet: 'veg', category: 'side', weight: 1, ingredients: ['flour', 'egg', 'butter'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Pretzel', cuisineTag: 'German', diet: 'veg', category: 'snack', weight: 2, ingredients: ['flour', 'yeast', 'salt', 'baking soda'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Sauerkraut', cuisineTag: 'German', diet: 'veg', category: 'side', weight: 1, ingredients: ['cabbage', 'salt', 'caraway'] },
  // Polish
  { continent: 'Europe', country: 'Poland', region: 'Polish', name: 'Pierogi', cuisineTag: 'Polish', diet: 'veg', category: 'main', weight: 2, ingredients: ['flour', 'potato', 'cheese', 'onion'] },
  { continent: 'Europe', country: 'Poland', region: 'Polish', name: 'Bigos', cuisineTag: 'Polish', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['cabbage', 'sausage', 'pork', 'mushroom'] },
  { continent: 'Europe', country: 'Poland', region: 'Polish', name: 'Żurek', cuisineTag: 'Polish', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['rye starter', 'sausage', 'egg', 'potato'] },
  // Russian
  { continent: 'Europe', country: 'Russia', region: 'Russian', name: 'Borscht', cuisineTag: 'Russian', diet: 'veg', category: 'side', weight: 2, ingredients: ['beetroot', 'cabbage', 'potato', 'sour cream'] },
  { continent: 'Europe', country: 'Russia', region: 'Russian', name: 'Beef Stroganoff', cuisineTag: 'Russian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'mushroom', 'sour cream', 'onion'] },
  { continent: 'Europe', country: 'Russia', region: 'Russian', name: 'Blini', cuisineTag: 'Russian', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['flour', 'milk', 'egg', 'butter'] },
  { continent: 'Europe', country: 'Russia', region: 'Russian', name: 'Pelmeni', cuisineTag: 'Russian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['flour', 'minced meat', 'onion'] },
  // Ukrainian
  { continent: 'Europe', country: 'Ukraine', region: 'Ukrainian', name: 'Varenyky', cuisineTag: 'Ukrainian', diet: 'veg', category: 'main', weight: 1, ingredients: ['flour', 'potato', 'cheese'] },
  { continent: 'Europe', country: 'Ukraine', region: 'Ukrainian', name: 'Chicken Kyiv', cuisineTag: 'Ukrainian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'butter', 'garlic', 'breadcrumbs'] },
  { continent: 'Europe', country: 'Ukraine', region: 'Ukrainian', name: 'Holubtsi', cuisineTag: 'Ukrainian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['cabbage', 'rice', 'minced meat', 'tomato'] },
  // Portuguese
  { continent: 'Europe', country: 'Portugal', region: 'Portuguese', name: 'Bacalhau à Brás', cuisineTag: 'Portuguese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['salt cod', 'potato', 'egg', 'onion'] },
  { continent: 'Europe', country: 'Portugal', region: 'Portuguese', name: 'Piri Piri Chicken', cuisineTag: 'Portuguese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'piri piri', 'garlic', 'lemon'] },
  { continent: 'Europe', country: 'Portugal', region: 'Portuguese', name: 'Pastel de Nata', cuisineTag: 'Portuguese', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['puff pastry', 'egg', 'cream', 'sugar'] },
  // Dutch
  { continent: 'Europe', country: 'Netherlands', region: 'Dutch', name: 'Stamppot', cuisineTag: 'Dutch', diet: 'veg', category: 'main', weight: 1, ingredients: ['potato', 'kale', 'butter', 'milk'] },
  { continent: 'Europe', country: 'Netherlands', region: 'Dutch', name: 'Bitterballen', cuisineTag: 'Dutch', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['beef', 'flour', 'breadcrumbs'] },
  { continent: 'Europe', country: 'Netherlands', region: 'Dutch', name: 'Poffertjes', cuisineTag: 'Dutch', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['flour', 'yeast', 'butter', 'powdered sugar'] },
  // Swedish
  { continent: 'Europe', country: 'Sweden', region: 'Swedish', name: 'Swedish Meatballs', cuisineTag: 'Swedish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['minced beef', 'cream', 'lingonberry', 'onion'] },
  { continent: 'Europe', country: 'Sweden', region: 'Swedish', name: 'Gravlax', cuisineTag: 'Swedish', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['salmon', 'dill', 'salt', 'sugar'] },
  { continent: 'Europe', country: 'Sweden', region: 'Swedish', name: 'Kanelbulle', cuisineTag: 'Swedish', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['flour', 'cinnamon', 'butter', 'cardamom'] },
  // Irish
  { continent: 'Europe', country: 'Ireland', region: 'Irish', name: 'Irish Stew', cuisineTag: 'Irish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['lamb', 'potato', 'carrot', 'onion'] },
  { continent: 'Europe', country: 'Ireland', region: 'Irish', name: 'Colcannon', cuisineTag: 'Irish', diet: 'veg', category: 'side', weight: 1, ingredients: ['potato', 'kale', 'butter', 'spring onion'] },
  { continent: 'Europe', country: 'Ireland', region: 'Irish', name: 'Soda Bread', cuisineTag: 'Irish', diet: 'veg', category: 'bread', weight: 1, ingredients: ['flour', 'buttermilk', 'baking soda'] },
  // Hungarian
  { continent: 'Europe', country: 'Hungary', region: 'Hungarian', name: 'Goulash', cuisineTag: 'Hungarian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'paprika', 'potato', 'onion'] },
  { continent: 'Europe', country: 'Hungary', region: 'Hungarian', name: 'Chicken Paprikash', cuisineTag: 'Hungarian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['chicken', 'paprika', 'sour cream', 'onion'] },
  { continent: 'Europe', country: 'Hungary', region: 'Hungarian', name: 'Lángos', cuisineTag: 'Hungarian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['flour', 'yeast', 'garlic', 'sour cream'] },
  // Austrian / Swiss / Belgian
  { continent: 'Europe', country: 'Austria', region: 'Austrian', name: 'Wiener Schnitzel', cuisineTag: 'Austrian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['veal', 'breadcrumbs', 'egg', 'lemon'] },
  { continent: 'Europe', country: 'Austria', region: 'Austrian', name: 'Apple Strudel', cuisineTag: 'Austrian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['apple', 'pastry', 'cinnamon', 'raisins'] },
  { continent: 'Europe', country: 'Switzerland', region: 'Swiss', name: 'Cheese Fondue', cuisineTag: 'Swiss', diet: 'veg', category: 'main', weight: 1, ingredients: ['gruyere', 'emmental', 'white wine', 'bread'] },
  { continent: 'Europe', country: 'Switzerland', region: 'Swiss', name: 'Rösti', cuisineTag: 'Swiss', diet: 'veg', category: 'side', weight: 2, ingredients: ['potato', 'butter', 'salt'] },
  { continent: 'Europe', country: 'Belgium', region: 'Belgian', name: 'Moules Frites', cuisineTag: 'Belgian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['mussels', 'potato', 'white wine', 'parsley'] },
  { continent: 'Europe', country: 'Belgium', region: 'Belgian', name: 'Belgian Waffles', cuisineTag: 'Belgian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['flour', 'egg', 'butter', 'pearl sugar'] },
  // Turkish
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Doner Kebab', cuisineTag: 'Turkish', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['lamb', 'flatbread', 'onion', 'yogurt'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Menemen', cuisineTag: 'Turkish', diet: 'nonveg', category: 'breakfast', weight: 2, ingredients: ['egg', 'tomato', 'green pepper', 'onion'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Lahmacun', cuisineTag: 'Turkish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['flatbread', 'minced meat', 'tomato', 'parsley'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Baklava', cuisineTag: 'Turkish', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['filo pastry', 'pistachio', 'honey', 'butter'] },

  // ── Asia (more) ─────────────────────────────────────────────────────────
  // Bangladeshi
  { continent: 'Asia', country: 'Bangladesh', region: 'Bangladeshi', name: 'Ilish Bhapa', cuisineTag: 'Bangladeshi', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['hilsa fish', 'mustard paste', 'green chilli'] },
  { continent: 'Asia', country: 'Bangladesh', region: 'Bangladeshi', name: 'Bhuna Khichuri', cuisineTag: 'Bangladeshi', diet: 'veg', category: 'main', weight: 2, ingredients: ['rice', 'lentils', 'ghee', 'whole spices'] },
  { continent: 'Asia', country: 'Bangladesh', region: 'Bangladeshi', name: 'Beef Bhuna', cuisineTag: 'Bangladeshi', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'onion', 'ginger', 'spices'] },
  // Nepali
  { continent: 'Asia', country: 'Nepal', region: 'Nepali', name: 'Dal Bhat', cuisineTag: 'Nepali', diet: 'veg', category: 'main', weight: 3, ingredients: ['rice', 'lentils', 'vegetables', 'pickle'] },
  { continent: 'Asia', country: 'Nepal', region: 'Nepali', name: 'Momo', cuisineTag: 'Nepali', diet: 'nonveg', category: 'snack', weight: 3, ingredients: ['flour', 'minced meat', 'onion', 'garlic'] },
  { continent: 'Asia', country: 'Nepal', region: 'Nepali', name: 'Sel Roti', cuisineTag: 'Nepali', diet: 'veg', category: 'snack', weight: 1, ingredients: ['rice flour', 'sugar', 'ghee'] },
  // Malaysian
  { continent: 'Asia', country: 'Malaysia', region: 'Malaysian', name: 'Nasi Lemak', cuisineTag: 'Malaysian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['rice', 'coconut milk', 'anchovies', 'sambal'] },
  { continent: 'Asia', country: 'Malaysia', region: 'Malaysian', name: 'Char Kway Teow', cuisineTag: 'Malaysian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['flat noodles', 'prawns', 'egg', 'bean sprouts'] },
  { continent: 'Asia', country: 'Malaysia', region: 'Malaysian', name: 'Roti Canai', cuisineTag: 'Malaysian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['flour', 'ghee', 'dhal'] },
  { continent: 'Asia', country: 'Malaysia', region: 'Malaysian', name: 'Laksa', cuisineTag: 'Malaysian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['noodles', 'coconut milk', 'prawns', 'laksa paste'] },
  // Singaporean
  { continent: 'Asia', country: 'Singapore', region: 'Singaporean', name: 'Hainanese Chicken Rice', cuisineTag: 'Singaporean', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['chicken', 'rice', 'ginger', 'garlic'] },
  { continent: 'Asia', country: 'Singapore', region: 'Singaporean', name: 'Chilli Crab', cuisineTag: 'Singaporean', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['crab', 'tomato', 'chilli', 'egg'] },
  { continent: 'Asia', country: 'Singapore', region: 'Singaporean', name: 'Kaya Toast', cuisineTag: 'Singaporean', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['bread', 'kaya jam', 'butter', 'egg'] },
  // Burmese / Cambodian / Taiwanese
  { continent: 'Asia', country: 'Myanmar', region: 'Burmese', name: 'Mohinga', cuisineTag: 'Burmese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['rice noodles', 'fish', 'lemongrass', 'chickpea flour'] },
  { continent: 'Asia', country: 'Myanmar', region: 'Burmese', name: 'Tea Leaf Salad', cuisineTag: 'Burmese', diet: 'veg', category: 'side', weight: 1, ingredients: ['fermented tea leaves', 'peanuts', 'tomato', 'garlic'] },
  { continent: 'Asia', country: 'Cambodia', region: 'Cambodian', name: 'Fish Amok', cuisineTag: 'Cambodian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['fish', 'coconut milk', 'kroeung', 'egg'] },
  { continent: 'Asia', country: 'Cambodia', region: 'Cambodian', name: 'Lok Lak', cuisineTag: 'Cambodian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'lettuce', 'lime', 'pepper'] },
  { continent: 'Asia', country: 'Taiwan', region: 'Taiwanese', name: 'Beef Noodle Soup', cuisineTag: 'Taiwanese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'noodles', 'soy sauce', 'bok choy'] },
  { continent: 'Asia', country: 'Taiwan', region: 'Taiwanese', name: 'Scallion Pancake', cuisineTag: 'Taiwanese', diet: 'veg', category: 'snack', weight: 2, ingredients: ['flour', 'spring onion', 'oil'] },
  // Iranian
  { continent: 'Asia', country: 'Iran', region: 'Persian', name: 'Chelo Kabab', cuisineTag: 'Persian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['lamb', 'rice', 'saffron', 'onion'] },
  { continent: 'Asia', country: 'Iran', region: 'Persian', name: 'Ghormeh Sabzi', cuisineTag: 'Persian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['lamb', 'herbs', 'kidney beans', 'dried lime'] },
  { continent: 'Asia', country: 'Iran', region: 'Persian', name: 'Tahdig', cuisineTag: 'Persian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'saffron', 'yogurt', 'butter'] },
  // Iraqi / Israeli / Saudi
  { continent: 'Asia', country: 'Iraq', region: 'Iraqi', name: 'Masgouf', cuisineTag: 'Iraqi', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['carp', 'tamarind', 'olive oil', 'lemon'] },
  { continent: 'Asia', country: 'Iraq', region: 'Iraqi', name: 'Dolma', cuisineTag: 'Iraqi', diet: 'veg', category: 'side', weight: 1, ingredients: ['grape leaves', 'rice', 'herbs', 'lemon'] },
  { continent: 'Asia', country: 'Israel', region: 'Israeli', name: 'Sabich', cuisineTag: 'Israeli', diet: 'veg', category: 'main', weight: 1, ingredients: ['pita', 'eggplant', 'egg', 'tahini'] },
  { continent: 'Asia', country: 'Israel', region: 'Israeli', name: 'Israeli Salad', cuisineTag: 'Israeli', diet: 'veg', category: 'side', weight: 2, ingredients: ['cucumber', 'tomato', 'onion', 'lemon'] },
  { continent: 'Asia', country: 'Saudi Arabia', region: 'Saudi', name: 'Kabsa', cuisineTag: 'Saudi', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['rice', 'chicken', 'whole spices', 'tomato'] },
  { continent: 'Asia', country: 'Saudi Arabia', region: 'Saudi', name: 'Mandi', cuisineTag: 'Saudi', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['rice', 'lamb', 'saffron', 'spices'] },
  // Afghan / Uzbek
  { continent: 'Asia', country: 'Afghanistan', region: 'Afghan', name: 'Kabuli Pulao', cuisineTag: 'Afghan', diet: 'nonveg', category: 'rice', weight: 2, ingredients: ['rice', 'lamb', 'carrot', 'raisins'] },
  { continent: 'Asia', country: 'Afghanistan', region: 'Afghan', name: 'Mantu', cuisineTag: 'Afghan', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['flour', 'minced beef', 'onion', 'yogurt'] },
  { continent: 'Asia', country: 'Afghanistan', region: 'Afghan', name: 'Bolani', cuisineTag: 'Afghan', diet: 'veg', category: 'snack', weight: 1, ingredients: ['flatbread', 'potato', 'leek', 'oil'] },
  { continent: 'Asia', country: 'Uzbekistan', region: 'Uzbek', name: 'Plov', cuisineTag: 'Uzbek', diet: 'nonveg', category: 'rice', weight: 2, ingredients: ['rice', 'lamb', 'carrot', 'cumin'] },
  { continent: 'Asia', country: 'Uzbekistan', region: 'Uzbek', name: 'Samsa', cuisineTag: 'Uzbek', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['flour', 'minced meat', 'onion'] },

  // ── Americas ────────────────────────────────────────────────────────────
  // Brazilian
  { continent: 'South America', country: 'Brazil', region: 'Brazilian', name: 'Feijoada', cuisineTag: 'Brazilian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['black beans', 'pork', 'sausage', 'rice'] },
  { continent: 'South America', country: 'Brazil', region: 'Brazilian', name: 'Pão de Queijo', cuisineTag: 'Brazilian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['tapioca flour', 'cheese', 'egg', 'milk'] },
  { continent: 'South America', country: 'Brazil', region: 'Brazilian', name: 'Moqueca', cuisineTag: 'Brazilian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['fish', 'coconut milk', 'tomato', 'palm oil'] },
  { continent: 'South America', country: 'Brazil', region: 'Brazilian', name: 'Brigadeiro', cuisineTag: 'Brazilian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['condensed milk', 'cocoa', 'butter', 'sprinkles'] },
  // Argentine
  { continent: 'South America', country: 'Argentina', region: 'Argentine', name: 'Asado', cuisineTag: 'Argentine', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'salt', 'chimichurri'] },
  { continent: 'South America', country: 'Argentina', region: 'Argentine', name: 'Empanadas', cuisineTag: 'Argentine', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['flour', 'minced beef', 'onion', 'egg'] },
  { continent: 'South America', country: 'Argentina', region: 'Argentine', name: 'Milanesa', cuisineTag: 'Argentine', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'breadcrumbs', 'egg', 'lemon'] },
  // Peruvian
  { continent: 'South America', country: 'Peru', region: 'Peruvian', name: 'Ceviche', cuisineTag: 'Peruvian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['white fish', 'lime', 'onion', 'chilli'] },
  { continent: 'South America', country: 'Peru', region: 'Peruvian', name: 'Lomo Saltado', cuisineTag: 'Peruvian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'onion', 'tomato', 'fries'] },
  { continent: 'South America', country: 'Peru', region: 'Peruvian', name: 'Aji de Gallina', cuisineTag: 'Peruvian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['chicken', 'aji amarillo', 'bread', 'walnuts'] },
  // Colombian / Chilean / Venezuelan
  { continent: 'South America', country: 'Colombia', region: 'Colombian', name: 'Bandeja Paisa', cuisineTag: 'Colombian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beans', 'pork', 'rice', 'plantain'] },
  { continent: 'South America', country: 'Colombia', region: 'Colombian', name: 'Arepas', cuisineTag: 'Colombian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['corn flour', 'cheese', 'butter'] },
  { continent: 'South America', country: 'Chile', region: 'Chilean', name: 'Pastel de Choclo', cuisineTag: 'Chilean', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['corn', 'minced beef', 'chicken', 'egg'] },
  { continent: 'South America', country: 'Venezuela', region: 'Venezuelan', name: 'Pabellón Criollo', cuisineTag: 'Venezuelan', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['shredded beef', 'black beans', 'rice', 'plantain'] },
  { continent: 'South America', country: 'Venezuela', region: 'Venezuelan', name: 'Cachapa', cuisineTag: 'Venezuelan', diet: 'veg', category: 'snack', weight: 1, ingredients: ['corn', 'cheese', 'butter'] },
  // Cuban / Jamaican / Canadian
  { continent: 'North America', country: 'Cuba', region: 'Cuban', name: 'Ropa Vieja', cuisineTag: 'Cuban', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['shredded beef', 'bell pepper', 'tomato', 'onion'] },
  { continent: 'North America', country: 'Cuba', region: 'Cuban', name: 'Cuban Sandwich', cuisineTag: 'Cuban', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['bread', 'ham', 'pork', 'pickles'] },
  { continent: 'North America', country: 'Cuba', region: 'Cuban', name: 'Black Beans and Rice', cuisineTag: 'Cuban', diet: 'veg', category: 'main', weight: 2, ingredients: ['black beans', 'rice', 'onion', 'cumin'] },
  { continent: 'North America', country: 'Jamaica', region: 'Jamaican', name: 'Jerk Chicken', cuisineTag: 'Jamaican', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'scotch bonnet', 'allspice', 'thyme'] },
  { continent: 'North America', country: 'Jamaica', region: 'Jamaican', name: 'Rice and Peas', cuisineTag: 'Jamaican', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'kidney beans', 'coconut milk', 'thyme'] },
  { continent: 'North America', country: 'Canada', region: 'Canadian', name: 'Poutine', cuisineTag: 'Canadian', diet: 'veg', category: 'side', weight: 2, ingredients: ['fries', 'cheese curds', 'gravy'] },
  { continent: 'North America', country: 'Canada', region: 'Canadian', name: 'Tourtière', cuisineTag: 'Canadian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced pork', 'potato', 'pastry', 'spices'] },

  // ── Africa (more) ───────────────────────────────────────────────────────
  // Moroccan
  { continent: 'Africa', country: 'Morocco', region: 'Moroccan', name: 'Chicken Tagine', cuisineTag: 'Moroccan', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'preserved lemon', 'olives', 'spices'] },
  { continent: 'Africa', country: 'Morocco', region: 'Moroccan', name: 'Couscous', cuisineTag: 'Moroccan', diet: 'veg', category: 'main', weight: 2, ingredients: ['couscous', 'vegetables', 'chickpeas', 'spices'] },
  { continent: 'Africa', country: 'Morocco', region: 'Moroccan', name: 'Harira', cuisineTag: 'Moroccan', diet: 'veg', category: 'side', weight: 1, ingredients: ['lentils', 'chickpeas', 'tomato', 'coriander'] },
  // Egyptian
  { continent: 'Africa', country: 'Egypt', region: 'Egyptian', name: 'Koshari', cuisineTag: 'Egyptian', diet: 'veg', category: 'main', weight: 2, ingredients: ['rice', 'lentils', 'pasta', 'fried onion'] },
  { continent: 'Africa', country: 'Egypt', region: 'Egyptian', name: 'Ful Medames', cuisineTag: 'Egyptian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['fava beans', 'olive oil', 'garlic', 'lemon'] },
  // South African
  { continent: 'Africa', country: 'South Africa', region: 'South African', name: 'Bobotie', cuisineTag: 'South African', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced beef', 'egg', 'curry powder', 'raisins'] },
  { continent: 'Africa', country: 'South Africa', region: 'South African', name: 'Bunny Chow', cuisineTag: 'South African', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['bread loaf', 'chicken curry', 'onion'] },
  { continent: 'Africa', country: 'South Africa', region: 'South African', name: 'Chakalaka', cuisineTag: 'South African', diet: 'veg', category: 'side', weight: 1, ingredients: ['beans', 'carrot', 'tomato', 'curry powder'] },
  // Kenyan / Ghanaian / Senegalese
  { continent: 'Africa', country: 'Kenya', region: 'Kenyan', name: 'Nyama Choma', cuisineTag: 'Kenyan', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['goat meat', 'salt', 'lemon'] },
  { continent: 'Africa', country: 'Kenya', region: 'Kenyan', name: 'Ugali with Sukuma Wiki', cuisineTag: 'Kenyan', diet: 'veg', category: 'main', weight: 2, ingredients: ['maize flour', 'collard greens', 'onion', 'tomato'] },
  { continent: 'Africa', country: 'Ghana', region: 'Ghanaian', name: 'Waakye', cuisineTag: 'Ghanaian', diet: 'veg', category: 'main', weight: 1, ingredients: ['rice', 'black-eyed beans', 'millet leaves'] },
  { continent: 'Africa', country: 'Ghana', region: 'Ghanaian', name: 'Kelewele', cuisineTag: 'Ghanaian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['plantain', 'ginger', 'chilli', 'spices'] },
  { continent: 'Africa', country: 'Senegal', region: 'Senegalese', name: 'Thieboudienne', cuisineTag: 'Senegalese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['fish', 'rice', 'tomato', 'vegetables'] },

  // ── Oceania ─────────────────────────────────────────────────────────────
  { continent: 'Oceania', country: 'Australia', region: 'Australian', name: 'Meat Pie', cuisineTag: 'Australian', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['minced beef', 'pastry', 'gravy'] },
  { continent: 'Oceania', country: 'Australia', region: 'Australian', name: 'Avocado Toast', cuisineTag: 'Australian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['bread', 'avocado', 'feta', 'lemon'] },
  { continent: 'Oceania', country: 'Australia', region: 'Australian', name: 'Pavlova', cuisineTag: 'Australian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['egg white', 'sugar', 'cream', 'fruit'] },
  { continent: 'Oceania', country: 'New Zealand', region: 'New Zealand', name: 'Kumara Mash', cuisineTag: 'New Zealand', diet: 'veg', category: 'side', weight: 1, ingredients: ['sweet potato', 'butter', 'milk'] },
  { continent: 'Oceania', country: 'New Zealand', region: 'New Zealand', name: 'Hokey Pokey', cuisineTag: 'New Zealand', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['sugar', 'golden syrup', 'baking soda'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Depth pass. More dishes per region so a household recognizes its everyday food,
// not just a token few. Still not exhaustive — extend freely.
// ─────────────────────────────────────────────────────────────────────────────
const EXPANSION: CatalogEntry[] = [
  // ── Maharashtrian (deep) ──
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Pav Bhaji', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['mixed vegetables', 'pav', 'butter', 'pav bhaji masala'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Varan Bhaat', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['toor dal', 'rice', 'ghee', 'turmeric'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Amti', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['toor dal', 'goda masala', 'jaggery', 'tamarind'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Zunka Bhakri', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['gram flour', 'onion', 'jowar flour'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Bharli Vangi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['brinjal', 'peanuts', 'coconut', 'goda masala'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Batata Bhaji', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['potato', 'mustard seeds', 'turmeric', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Matki Usal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['moth beans', 'onion', 'goda masala'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Sabudana Vada', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['sabudana', 'potato', 'peanuts', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Kothimbir Vadi', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['gram flour', 'coriander', 'sesame'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Sol Kadhi', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['kokum', 'coconut milk', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Masale Bhat', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'vegetables', 'goda masala', 'cashew'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Kolhapuri Chicken', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'kolhapuri masala', 'coconut', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Chicken Sukka', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'coconut', 'red chilli', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Bombil Fry', cuisineTag: 'Indian', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['bombay duck', 'semolina', 'red chilli'] },
  { continent: 'Asia', country: 'India', region: 'Maharashtrian', name: 'Modak', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['rice flour', 'coconut', 'jaggery'] },

  // ── Punjabi (deep) ──
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Amritsari Kulcha', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 2, ingredients: ['refined flour', 'potato', 'paneer', 'butter'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Makki di Roti', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 2, ingredients: ['maize flour', 'ghee'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Kadai Paneer', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['paneer', 'bell pepper', 'tomato', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Amritsari Fish', cuisineTag: 'Indian', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['fish', 'gram flour', 'ajwain', 'lemon'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Tandoori Chicken', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'yogurt', 'tandoori masala', 'lemon'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Lassi', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['yogurt', 'sugar', 'cardamom'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Pindi Chana', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['chickpeas', 'tea', 'pomegranate seeds', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Gajar Ka Halwa', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['carrot', 'milk', 'sugar', 'ghee'] },

  // ── Gujarati (deep) ──
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Khaman', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['gram flour', 'yogurt', 'mustard seeds'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Fafda Jalebi', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['gram flour', 'ajwain', 'sugar syrup'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Sev Tameta', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['tomato', 'sev', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Muthia', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['bottle gourd', 'gram flour', 'wheat flour'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Bhinda nu Shaak', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['okra', 'gram flour', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Khichdi Kadhi', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['rice', 'moong dal', 'yogurt', 'gram flour'] },
  { continent: 'Asia', country: 'India', region: 'Gujarati', name: 'Basundi', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['milk', 'sugar', 'cardamom', 'nuts'] },

  // ── South Indian (deep) ──
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Rava Dosa', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['semolina', 'rice flour', 'onion', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Uttapam', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['dosa batter', 'onion', 'tomato', 'chilli'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Pongal', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['rice', 'moong dal', 'pepper', 'ghee'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Tomato Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'tomato', 'onion', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Tamarind Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'tamarind', 'peanuts', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Vegetable Kurma', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['mixed vegetables', 'coconut', 'cashew', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Set Dosa', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['rice', 'urad dal', 'poha'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Chicken Chettinad', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'coconut', 'pepper', 'fennel'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Fish Fry', cuisineTag: 'Indian', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['fish', 'red chilli', 'ginger-garlic', 'curry leaves'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Kesari Bath', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['semolina', 'sugar', 'ghee', 'saffron'] },
  { continent: 'Asia', country: 'India', region: 'South Indian', name: 'Ragi Mudde', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['ragi flour', 'water'] },

  // ── Bengali (deep) ──
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Chingri Malai Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['prawns', 'coconut milk', 'onion', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Shukto', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['mixed vegetables', 'bitter gourd', 'milk', 'ginger'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Begun Bhaja', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['brinjal', 'turmeric', 'mustard oil'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Chicken Kosha', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'onion', 'yogurt', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Rasgulla', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['chhena', 'sugar syrup'] },
  { continent: 'Asia', country: 'India', region: 'Bengali', name: 'Sandesh', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['chhena', 'sugar', 'cardamom'] },

  // ── Rajasthani / new India regions ──
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Pyaaz Kachori', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['flour', 'onion', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Mirchi Vada', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 1, ingredients: ['chilli', 'potato', 'gram flour'] },
  { continent: 'Asia', country: 'India', region: 'Rajasthani', name: 'Besan Gatta Pulao', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 1, ingredients: ['rice', 'gram flour', 'yogurt'] },
  { continent: 'Asia', country: 'India', region: 'Hyderabadi', name: 'Hyderabadi Haleem', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['wheat', 'mutton', 'lentils', 'ghee'] },
  { continent: 'Asia', country: 'India', region: 'Hyderabadi', name: 'Mirchi Ka Salan', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 1, ingredients: ['green chilli', 'peanut', 'sesame', 'tamarind'] },
  { continent: 'Asia', country: 'India', region: 'Hyderabadi', name: 'Double Ka Meetha', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['bread', 'milk', 'sugar', 'nuts'] },
  { continent: 'Asia', country: 'India', region: 'Bihari', name: 'Litti Chokha', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['wheat flour', 'sattu', 'brinjal', 'potato'] },
  { continent: 'Asia', country: 'India', region: 'Sindhi', name: 'Sindhi Kadhi', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['gram flour', 'vegetables', 'tamarind'] },
  { continent: 'Asia', country: 'India', region: 'Sindhi', name: 'Dal Pakwan', cuisineTag: 'Indian', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['chana dal', 'refined flour', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Kashmiri', name: 'Yakhni Pulao', cuisineTag: 'Indian', diet: 'nonveg', category: 'rice', weight: 1, ingredients: ['rice', 'mutton', 'yogurt', 'fennel'] },
  { continent: 'Asia', country: 'India', region: 'Assamese', name: 'Masor Tenga', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['fish', 'tomato', 'lemon', 'turmeric'] },
  { continent: 'Asia', country: 'India', region: 'Odia', name: 'Dalma', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 1, ingredients: ['toor dal', 'vegetables', 'coconut', 'cumin'] },

  // ── Pan-Indian everyday & street ──
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Samosa', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 3, ingredients: ['flour', 'potato', 'peas', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Pani Puri', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['puri', 'potato', 'tamarind water', 'chickpeas'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Bhel Puri', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['puffed rice', 'sev', 'onion', 'chutney'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Aloo Tikki', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['potato', 'peas', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Frankie', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['roti', 'potato', 'onion', 'chutney'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Baingan Bharta', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['brinjal', 'onion', 'tomato', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Palak Dal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['spinach', 'toor dal', 'garlic', 'cumin'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Moong Dal', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 3, ingredients: ['moong dal', 'turmeric', 'cumin', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Gobi Manchurian', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['cauliflower', 'cornflour', 'soy sauce', 'garlic'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Matar Paneer', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 3, ingredients: ['paneer', 'peas', 'tomato', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Kheer', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['rice', 'milk', 'sugar', 'cardamom'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Gulab Jamun', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['milk powder', 'sugar syrup', 'cardamom'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Mutton Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['mutton', 'onion', 'tomato', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Fish Curry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['fish', 'coconut', 'tamarind', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Keema Matar', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['minced meat', 'peas', 'onion', 'tomato'] },

  // ── American (deep) ──
  { continent: 'North America', country: 'USA', region: 'American', name: 'Cheeseburger', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['beef patty', 'burger bun', 'cheese', 'lettuce'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Hot Dog', cuisineTag: 'American', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['sausage', 'bun', 'mustard', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Buffalo Wings', cuisineTag: 'American', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['chicken wings', 'hot sauce', 'butter'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Cobb Salad', cuisineTag: 'American', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['lettuce', 'chicken', 'egg', 'bacon'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Meatloaf', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced beef', 'breadcrumbs', 'ketchup', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Clam Chowder', cuisineTag: 'American', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['clams', 'potato', 'cream', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Pot Roast', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'carrot', 'potato', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Philly Cheesesteak', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['beef', 'hoagie roll', 'cheese', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Chicken Pot Pie', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['chicken', 'pastry', 'peas', 'carrot'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Sloppy Joe', cuisineTag: 'American', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced beef', 'bun', 'tomato sauce', 'onion'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'French Toast', cuisineTag: 'American', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['bread', 'egg', 'milk', 'cinnamon'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Biscuits and Gravy', cuisineTag: 'American', diet: 'nonveg', category: 'breakfast', weight: 1, ingredients: ['biscuits', 'sausage', 'flour', 'milk'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Bagel with Cream Cheese', cuisineTag: 'American', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['bagel', 'cream cheese'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Nachos', cuisineTag: 'American', diet: 'veg', category: 'snack', weight: 2, ingredients: ['tortilla chips', 'cheese', 'jalapeno', 'salsa'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Apple Pie', cuisineTag: 'American', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['apple', 'pastry', 'cinnamon', 'sugar'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Brownies', cuisineTag: 'American', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['chocolate', 'flour', 'butter', 'egg'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'Chocolate Chip Cookies', cuisineTag: 'American', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['flour', 'chocolate chips', 'butter', 'sugar'] },
  { continent: 'North America', country: 'USA', region: 'American', name: 'PB&J Sandwich', cuisineTag: 'American', diet: 'veg', category: 'snack', weight: 2, ingredients: ['bread', 'peanut butter', 'jam'] },

  // ── Italian (deep) ──
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Spaghetti Bolognese', cuisineTag: 'Italian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['spaghetti', 'minced beef', 'tomato', 'onion'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Pesto Pasta', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 2, ingredients: ['pasta', 'basil', 'pine nuts', 'parmesan'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Pepperoni Pizza', cuisineTag: 'Italian', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['pizza base', 'pepperoni', 'mozzarella', 'tomato'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Gnocchi', cuisineTag: 'Italian', diet: 'veg', category: 'main', weight: 1, ingredients: ['potato', 'flour', 'tomato', 'basil'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Bruschetta', cuisineTag: 'Italian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['bread', 'tomato', 'basil', 'garlic'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Caprese Salad', cuisineTag: 'Italian', diet: 'veg', category: 'side', weight: 2, ingredients: ['mozzarella', 'tomato', 'basil', 'olive oil'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Chicken Parmigiana', cuisineTag: 'Italian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'breadcrumbs', 'tomato', 'cheese'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Tiramisu', cuisineTag: 'Italian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['ladyfingers', 'mascarpone', 'coffee', 'cocoa'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Focaccia', cuisineTag: 'Italian', diet: 'veg', category: 'bread', weight: 1, ingredients: ['flour', 'olive oil', 'rosemary', 'yeast'] },
  { continent: 'Europe', country: 'Italy', region: 'Italian', name: 'Minestrone Soup', cuisineTag: 'Italian', diet: 'veg', category: 'side', weight: 1, ingredients: ['beans', 'vegetables', 'pasta', 'tomato'] },

  // ── Chinese (deep) ──
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Fried Rice', cuisineTag: 'Chinese', diet: 'nonveg', category: 'rice', weight: 3, ingredients: ['rice', 'egg', 'vegetables', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Chow Mein', cuisineTag: 'Chinese', diet: 'veg', category: 'main', weight: 3, ingredients: ['noodles', 'cabbage', 'carrot', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Spring Rolls', cuisineTag: 'Chinese', diet: 'veg', category: 'snack', weight: 2, ingredients: ['spring roll wrapper', 'cabbage', 'carrot', 'noodles'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Wonton Soup', cuisineTag: 'Chinese', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['wonton', 'pork', 'broth', 'spring onion'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Chilli Chicken', cuisineTag: 'Chinese', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['chicken', 'bell pepper', 'soy sauce', 'garlic'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Egg Fried Rice', cuisineTag: 'Chinese', diet: 'nonveg', category: 'rice', weight: 3, ingredients: ['rice', 'egg', 'spring onion', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Honey Chilli Potato', cuisineTag: 'Chinese', diet: 'veg', category: 'snack', weight: 2, ingredients: ['potato', 'honey', 'chilli', 'sesame'] },
  { continent: 'Asia', country: 'China', region: 'Cantonese', name: 'Char Siu', cuisineTag: 'Chinese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['pork', 'hoisin', 'honey', 'soy sauce'] },
  { continent: 'Asia', country: 'China', region: 'Sichuan', name: 'Hot and Sour Soup', cuisineTag: 'Chinese', diet: 'veg', category: 'side', weight: 2, ingredients: ['tofu', 'mushroom', 'vinegar', 'white pepper'] },
  { continent: 'Asia', country: 'China', region: 'Chinese', name: 'Manchow Soup', cuisineTag: 'Chinese', diet: 'veg', category: 'side', weight: 2, ingredients: ['mixed vegetables', 'soy sauce', 'garlic', 'fried noodles'] },

  // ── Mexican (deep) ──
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Chicken Tacos', cuisineTag: 'Mexican', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['tortilla', 'chicken', 'salsa', 'onion'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Nachos Supreme', cuisineTag: 'Mexican', diet: 'veg', category: 'snack', weight: 2, ingredients: ['tortilla chips', 'beans', 'cheese', 'guacamole'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Tamales', cuisineTag: 'Mexican', diet: 'veg', category: 'main', weight: 1, ingredients: ['corn masa', 'chilli', 'corn husk'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Pozole', cuisineTag: 'Mexican', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['hominy', 'pork', 'chilli', 'onion'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Huevos Rancheros', cuisineTag: 'Mexican', diet: 'nonveg', category: 'breakfast', weight: 2, ingredients: ['egg', 'tortilla', 'salsa', 'beans'] },
  { continent: 'North America', country: 'Mexico', region: 'Mexican', name: 'Pico de Gallo', cuisineTag: 'Mexican', diet: 'veg', category: 'side', weight: 1, ingredients: ['tomato', 'onion', 'cilantro', 'lime'] },

  // ── Thai / Japanese / Korean (deep) ──
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Thai Red Curry', cuisineTag: 'Thai', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['red curry paste', 'coconut milk', 'chicken', 'basil'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Papaya Salad', cuisineTag: 'Thai', diet: 'veg', category: 'side', weight: 1, ingredients: ['green papaya', 'peanuts', 'lime', 'chilli'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Massaman Curry', cuisineTag: 'Thai', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['massaman paste', 'coconut milk', 'potato', 'beef'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Sushi Rolls', cuisineTag: 'Japanese', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['rice', 'nori', 'fish', 'cucumber'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Gyoza', cuisineTag: 'Japanese', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['dumpling wrapper', 'pork', 'cabbage', 'ginger'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Udon', cuisineTag: 'Japanese', diet: 'veg', category: 'main', weight: 2, ingredients: ['udon noodles', 'dashi', 'spring onion'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Tempura', cuisineTag: 'Japanese', diet: 'veg', category: 'snack', weight: 1, ingredients: ['vegetables', 'tempura batter', 'dipping sauce'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Kimchi', cuisineTag: 'Korean', diet: 'veg', category: 'side', weight: 2, ingredients: ['napa cabbage', 'gochugaru', 'garlic', 'ginger'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Tteokbokki', cuisineTag: 'Korean', diet: 'veg', category: 'snack', weight: 2, ingredients: ['rice cakes', 'gochujang', 'fish cake'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Korean Fried Chicken', cuisineTag: 'Korean', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'gochujang', 'soy sauce', 'garlic'] },

  // ── Middle Eastern / Mediterranean (deep) ──
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Chicken Kebab', cuisineTag: 'Middle Eastern', diet: 'nonveg', category: 'main', weight: 3, ingredients: ['chicken', 'yogurt', 'garlic', 'spices'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Fattoush', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'side', weight: 1, ingredients: ['lettuce', 'tomato', 'pita chips', 'sumac'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Manakish', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['flatbread', 'zaatar', 'olive oil'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Kibbeh', cuisineTag: 'Middle Eastern', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['bulgur', 'minced meat', 'onion', 'pine nuts'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Mujadara', cuisineTag: 'Middle Eastern', diet: 'veg', category: 'main', weight: 1, ingredients: ['lentils', 'rice', 'fried onion'] },
  { continent: 'Asia', country: 'Lebanon', region: 'Middle Eastern', name: 'Lamb Shawarma', cuisineTag: 'Middle Eastern', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['lamb', 'pita', 'garlic sauce', 'pickles'] },

  // ── British / French / Greek / Spanish (deep) ──
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Full English Breakfast', cuisineTag: 'British', diet: 'nonveg', category: 'breakfast', weight: 2, ingredients: ['egg', 'sausage', 'beans', 'toast'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Chicken Tikka Masala', cuisineTag: 'British', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['chicken', 'tomato', 'cream', 'spices'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Bangers and Mash', cuisineTag: 'British', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['sausage', 'potato', 'onion gravy'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Scones', cuisineTag: 'British', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['flour', 'butter', 'cream', 'jam'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Coq au Vin', cuisineTag: 'French', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['chicken', 'red wine', 'mushroom', 'onion'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'French Onion Soup', cuisineTag: 'French', diet: 'veg', category: 'side', weight: 1, ingredients: ['onion', 'stock', 'bread', 'cheese'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Crepes', cuisineTag: 'French', diet: 'veg', category: 'breakfast', weight: 2, ingredients: ['flour', 'milk', 'egg', 'butter'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Gyros', cuisineTag: 'Greek', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['pork', 'pita', 'tzatziki', 'tomato'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Spanakopita', cuisineTag: 'Greek', diet: 'veg', category: 'snack', weight: 1, ingredients: ['spinach', 'feta', 'filo pastry'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Gazpacho', cuisineTag: 'Spanish', diet: 'veg', category: 'side', weight: 1, ingredients: ['tomato', 'cucumber', 'pepper', 'olive oil'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Churros', cuisineTag: 'Spanish', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['flour', 'sugar', 'chocolate'] },

  // ── Second depth pass: rounding out world cuisines ──
  // German / Polish / Turkish / Greek / Spanish / French / British extra
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Currywurst', cuisineTag: 'German', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['sausage', 'curry ketchup', 'fries'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Kartoffelsalat', cuisineTag: 'German', diet: 'veg', category: 'side', weight: 1, ingredients: ['potato', 'vinegar', 'onion', 'mustard'] },
  { continent: 'Europe', country: 'Germany', region: 'German', name: 'Rouladen', cuisineTag: 'German', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'bacon', 'pickle', 'onion'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Iskender Kebab', cuisineTag: 'Turkish', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['lamb', 'pita', 'tomato sauce', 'yogurt'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Kofte', cuisineTag: 'Turkish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['minced meat', 'onion', 'parsley', 'spices'] },
  { continent: 'Europe', country: 'Turkey', region: 'Turkish', name: 'Simit', cuisineTag: 'Turkish', diet: 'veg', category: 'breakfast', weight: 1, ingredients: ['flour', 'sesame', 'molasses'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Tzatziki', cuisineTag: 'Greek', diet: 'veg', category: 'side', weight: 2, ingredients: ['yogurt', 'cucumber', 'garlic', 'dill'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Dolmades', cuisineTag: 'Greek', diet: 'veg', category: 'snack', weight: 1, ingredients: ['grape leaves', 'rice', 'herbs', 'lemon'] },
  { continent: 'Europe', country: 'Greece', region: 'Greek', name: 'Baklava', cuisineTag: 'Greek', diet: 'veg', category: 'sweet', weight: 1, ingredients: ['filo', 'walnuts', 'honey', 'butter'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Tortilla Española', cuisineTag: 'Spanish', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['potato', 'egg', 'onion'] },
  { continent: 'Europe', country: 'Spain', region: 'Spanish', name: 'Croquetas', cuisineTag: 'Spanish', diet: 'nonveg', category: 'snack', weight: 1, ingredients: ['ham', 'bechamel', 'breadcrumbs'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Croque Monsieur', cuisineTag: 'French', diet: 'nonveg', category: 'snack', weight: 2, ingredients: ['bread', 'ham', 'cheese', 'bechamel'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Nicoise Salad', cuisineTag: 'French', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['tuna', 'egg', 'green beans', 'olives'] },
  { continent: 'Europe', country: 'France', region: 'French', name: 'Beef Bourguignon', cuisineTag: 'French', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'red wine', 'mushroom', 'carrot'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Cottage Pie', cuisineTag: 'British', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['minced beef', 'potato', 'peas', 'carrot'] },
  { continent: 'Europe', country: 'UK', region: 'British', name: 'Ploughman’s Lunch', cuisineTag: 'British', diet: 'veg', category: 'snack', weight: 1, ingredients: ['cheese', 'bread', 'pickle', 'apple'] },
  // Japanese / Thai / Korean / Vietnamese extra
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Donburi', cuisineTag: 'Japanese', diet: 'nonveg', category: 'rice', weight: 2, ingredients: ['rice', 'chicken', 'egg', 'onion'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Okonomiyaki', cuisineTag: 'Japanese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['cabbage', 'flour', 'egg', 'pork'] },
  { continent: 'Asia', country: 'Japan', region: 'Japanese', name: 'Edamame', cuisineTag: 'Japanese', diet: 'veg', category: 'snack', weight: 2, ingredients: ['soybeans', 'salt'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Tom Kha Gai', cuisineTag: 'Thai', diet: 'nonveg', category: 'side', weight: 1, ingredients: ['chicken', 'coconut milk', 'galangal', 'lemongrass'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Pad See Ew', cuisineTag: 'Thai', diet: 'veg', category: 'main', weight: 2, ingredients: ['flat noodles', 'soy sauce', 'egg', 'gai lan'] },
  { continent: 'Asia', country: 'Thailand', region: 'Thai', name: 'Mango Sticky Rice', cuisineTag: 'Thai', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['sticky rice', 'mango', 'coconut milk'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Sundubu Jjigae', cuisineTag: 'Korean', diet: 'veg', category: 'main', weight: 1, ingredients: ['soft tofu', 'gochugaru', 'egg', 'vegetables'] },
  { continent: 'Asia', country: 'Korea', region: 'Korean', name: 'Galbi', cuisineTag: 'Korean', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef short ribs', 'soy sauce', 'pear', 'garlic'] },
  { continent: 'Asia', country: 'Vietnam', region: 'Vietnamese', name: 'Bun Cha', cuisineTag: 'Vietnamese', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['pork', 'rice noodles', 'herbs', 'fish sauce'] },
  { continent: 'Asia', country: 'Vietnam', region: 'Vietnamese', name: 'Com Tam', cuisineTag: 'Vietnamese', diet: 'nonveg', category: 'rice', weight: 1, ingredients: ['broken rice', 'grilled pork', 'egg', 'pickles'] },
  // More India everyday + regional
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Kolhapuri', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['mixed vegetables', 'coconut', 'onion', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Malai Kofta', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['paneer', 'potato', 'cream', 'cashew'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Dum Aloo', cuisineTag: 'Indian', diet: 'veg', category: 'side', weight: 2, ingredients: ['baby potato', 'yogurt', 'tomato', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Kadhi Pakora', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['yogurt', 'gram flour', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Hakka Noodles', cuisineTag: 'Indian', diet: 'veg', category: 'main', weight: 2, ingredients: ['noodles', 'vegetables', 'soy sauce'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Egg Bhurji', cuisineTag: 'Indian', diet: 'nonveg', category: 'side', weight: 3, ingredients: ['eggs', 'onion', 'tomato', 'green chilli'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Butter Naan', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 3, ingredients: ['refined flour', 'butter', 'yogurt'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Tandoori Roti', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 3, ingredients: ['wheat flour'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Veg Cutlet', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['mixed vegetables', 'potato', 'breadcrumbs'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Dahi Vada', cuisineTag: 'Indian', diet: 'veg', category: 'snack', weight: 2, ingredients: ['urad dal', 'yogurt', 'tamarind chutney'] },
  { continent: 'Asia', country: 'India', region: 'Pan-Indian', name: 'Jalebi', cuisineTag: 'Indian', diet: 'veg', category: 'sweet', weight: 2, ingredients: ['flour', 'sugar syrup', 'saffron'] },
  { continent: 'Asia', country: 'India', region: 'Awadhi', name: 'Mutton Korma', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 2, ingredients: ['mutton', 'yogurt', 'cashew', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Kerala Beef Fry', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['beef', 'coconut', 'curry leaves', 'spices'] },
  { continent: 'Asia', country: 'India', region: 'Kerala', name: 'Parotta', cuisineTag: 'Indian', diet: 'veg', category: 'bread', weight: 2, ingredients: ['refined flour', 'oil', 'egg'] },
  { continent: 'Asia', country: 'India', region: 'Tamil', name: 'Kothu Parotta', cuisineTag: 'Indian', diet: 'nonveg', category: 'main', weight: 1, ingredients: ['parotta', 'egg', 'chicken', 'onion'] },
  { continent: 'Asia', country: 'India', region: 'Tamil', name: 'Sambar Rice', cuisineTag: 'Indian', diet: 'veg', category: 'rice', weight: 2, ingredients: ['rice', 'toor dal', 'vegetables', 'sambar powder'] },
];

// The full catalog. Extend by appending regions/countries — no code change.
export const STARTER_CATALOG: CatalogEntry[] = [...INDIA, ...GLOBAL, ...EXPANSION];

// Distinct countries present in the catalog (for the onboarding country picker).
export const CATALOG_COUNTRIES: string[] = Array.from(
  new Set(STARTER_CATALOG.map((e) => e.country)),
);

// Regions available for a given country (for the region multi-select).
export function regionsForCountry(country: string): string[] {
  return Array.from(
    new Set(
      STARTER_CATALOG.filter((e) => e.country === country).map((e) => e.region),
    ),
  );
}

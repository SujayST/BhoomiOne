const productModel = require("../models/products");
const categoryModel = require("../models/categories");
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Curated Agricultural Knowledge Base
const KNOWLEDGE_BASE = [
  {
    keywords: ["leaf curl", "curl", "virus", "whitefly", "tomato", "chilli", "leaves curling"],
    topic: "Crop Disease & Pest Management",
    answer: "Leaf curl is predominantly caused by the Tomato/Chilli Leaf Curl Virus transmitted by whiteflies, or by mite infestation. \n\n• Immediate Action: Spray Neem Oil (3-5 ml/L) or systemic insecticide like Imidacloprid (0.5 ml/L) / Acetamiprid to control the whitefly vector.\n• Organic Remedy: Spray sour buttermilk solution (50ml/L) or bio-pesticide every 7 days.\n• Nutrition: Apply Micronutrient Zinc + Boron spray to assist leaf recovery.",
    weatherNote: "Warm, dry weather (28°C-35°C) accelerates whitefly population. Maintain adequate soil moisture.",
    searchTerms: ["pesticide", "neem", "insecticide", "spray", "micronutrient", "bio"],
    followUps: ["How to prepare organic neem spray?", "Best fertilizers for tomato fruiting?", "Whitefly prevention tips"],
  },
  {
    keywords: ["fertilizer", "npk", "urea", "growth", "nutrition", "yield", "soil", "organic fertilizer", "manure", "dap"],
    topic: "Soil Nutrition & Fertilization",
    answer: "Balanced soil nutrition is key to maximizing crop yield and root development.\n\n• Basal Dose: Apply NPK 19:19:19 or DAP + Potash during sowing for strong root establishment.\n• Vegetative Stage: Use High-Nitrogen (NPK 12:61:00 / Urea) for lush green vegetative growth.\n• Flowering & Fruiting: Switch to High-Potassium (NPK 0:52:34 or NPK 0:0:50) with Boron to prevent flower drop and increase fruit weight.",
    weatherNote: "Apply granular fertilizers before light irrigation or mild rain. Avoid applying just before heavy downpours to prevent nutrient leaching.",
    searchTerms: ["fertilizer", "npk", "organic", "growth", "soil", "nutrient"],
    followUps: ["Dosage of NPK 19:19:19 per acre?", "How to prevent flower drop?", "Organic compost benefits"],
  },
  {
    keywords: ["weather", "monsoon", "rain", "rainy", "storm", "forecast", "climate", "temperature", "humidity", "kharif sowing"],
    topic: "Weather & Seasonal Advisory",
    answer: "Seasonal Weather Advisory for Agriculture:\n\n• Monsoon / Rainy Season: Ensure proper field drainage to avoid waterlogging and root rot. Hold off on chemical spraying if rain is expected within 4 hours.\n• Sowing Window: Optimal soil moisture for Kharif crops (Paddy, Cotton, Soybean, Maize) is 60-70% field capacity.\n• Fungicide Protection: Humid cloudy conditions promote fungal blights; keep systemic fungicides ready for preventive spray.",
    weatherNote: "Current Indian seasonal conditions favor Kharif sowing and timely weed management.",
    searchTerms: ["seeds", "drainage", "fungicide", "protection", "kharif"],
    followUps: ["Best Kharif crops for low rainfall?", "Preventive spray after heavy rain", "Drip irrigation maintenance"],
  },
  {
    keywords: ["seed", "seeds", "hybrid", "germination", "sowing", "paddy", "wheat", "cotton", "maize", "vegetable seeds"],
    topic: "Certified Seeds & Germination",
    answer: "Tips for Maximum Seed Germination & High Yield:\n\n• Seed Treatment: Treat seeds with Trichoderma viride (10g/kg) or Carbendazim (2g/kg) to protect against seed-borne damping off and collar rot.\n• Sowing Depth: Sow at 2-3 cm depth in well-pulverized, moist seedbeds.\n• Germination Test: Verify minimum 85% germination rate before extensive field planting.",
    weatherNote: "Ideal soil temperature for germination is between 22°C and 30°C.",
    searchTerms: ["seed", "hybrid", "tomato", "cotton", "crop"],
    followUps: ["How to do seed germination testing?", "Seed spacing chart per acre", "Organic seed treatment methods"],
  },
  {
    keywords: ["pest", "insect", "worm", "caterpillar", "borer", "aphid", "thrips", "blight", "fungus", "pesticide", "fungicide"],
    topic: "Pest & Crop Protection",
    answer: "Integrated Pest Management (IPM) Strategy:\n\n• Sucking Pests (Aphids, Thrips): Spray Thiamethoxam 25% WG (0.5g/L) or Bio-Pesticide Verticillium lecanii.\n• Stem Borer / Caterpillars: Spray Chlorantraniliprole 18.5% SC or Emamectin Benzoate 5% SG.\n• Fungal Blight / Rust: Apply Azoxystrobin + Difenoconazole or Mancozeb (2g/L) immediately at initial sign.",
    weatherNote: "Spray during early morning or late afternoon when wind speeds are below 10 km/h and pollinating bees are less active.",
    searchTerms: ["pesticide", "fungicide", "protection", "spray", "insecticide"],
    followUps: ["Safe spraying equipment & nozzles?", "Yellow sticky trap installation", "Biological pest predators"],
  },
  {
    keywords: ["tractor", "tools", "machinery", "equipment", "sprayer", "tiller", "irrigation", "drip", "pipe", "pump"],
    topic: "Farm Machinery & Tools",
    answer: "Farm Mechanization & Irrigation Guidance:\n\n• Knapsack & Battery Sprayers: Ensure uniform pressure and clean brass nozzles for even pesticide coverage.\n• Drip & Micro Irrigation: Saves 40-50% water while increasing fertilizer efficiency by 30% via fertigation.\n• Power Tillers & Weeders: Greatly reduces manual weeding labor and improves soil aeration.",
    weatherNote: "Perform regular pump and drip lateral flushing before the dry season kicks in.",
    searchTerms: ["sprayer", "tool", "machinery", "irrigation", "equipment"],
    followUps: ["How to clean drip irrigation emitters?", "Battery sprayer battery maintenance", "Best weeding tools for horticulture"],
  },
];

class AIAssistantController {
  async handleFarmerQuery(req, res) {
    try {
      const { query, location, crop } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: "Please provide a query for the AI Assistant" });
      }

      const cleanQuery = query.toLowerCase().trim();

      // 1. Identify best matching knowledge entry
      let bestMatch = null;
      let highestScore = 0;

      for (const entry of KNOWLEDGE_BASE) {
        let score = 0;
        for (const kw of entry.keywords) {
          if (cleanQuery.includes(kw)) {
            score += 2;
          }
        }
        if (score > highestScore) {
          highestScore = score;
          bestMatch = entry;
        }
      }

      // Default agronomy advice if no specific keyword matched
      if (!bestMatch || highestScore === 0) {
        bestMatch = {
          topic: "General Agricultural Advisory",
          answer: `Here is agricultural guidance for "${query}":\n\n• Soil & Crop Health: Ensure soil is tested for N-P-K and pH (ideal 6.5-7.5). Practice crop rotation and incorporate organic manure.\n• Pest Monitoring: Inspect the underside of leaves weekly for early signs of sucking pests or fungal spots.\n• Quality Inputs: Use certified hybrid seeds, balanced water soluble fertilizers, and recommended protection sprays for maximum yield.`,
          weatherNote: "Maintain optimal field moisture and avoid spraying during high noon winds or direct rain.",
          searchTerms: ["fertilizer", "seed", "pesticide", "organic", "hybrid"],
          followUps: ["Best fertilizers for current season?", "How to cure pest attacks?", "Recommend high-yield seeds"],
        };
      }

      // 2. Query Live Database for Relevant Products
      let recommendedProducts = [];
      try {
        const orConditions = [];
        for (const term of bestMatch.searchTerms) {
          orConditions.push({ pName: new RegExp(term, 'i') });
          orConditions.push({ pDescription: new RegExp(term, 'i') });
        }
        const firstWord = cleanQuery.split(' ')[0];
        if (firstWord && firstWord.length > 2) {
          orConditions.push({ pName: new RegExp(firstWord, 'i') });
        }

        if (orConditions.length > 0) {
          recommendedProducts = await productModel
            .find({
              $or: orConditions,
              pStatus: "Active",
            })
            .limit(6)
            .populate("pCategory", "cName")
            .populate("pStore", "sName");
        }

        // Fallback to active products if no specific keyword matched
        if (!recommendedProducts || recommendedProducts.length === 0) {
          recommendedProducts = await productModel
            .find({ pStatus: "Active" })
            .limit(4)
            .populate("pCategory", "cName")
            .populate("pStore", "sName");
        }
      } catch (dbErr) {
        console.log("DB search error:", dbErr);
        recommendedProducts = [];
      }

      // 3. Resolve Product Image URLs safely
      for (let prod of recommendedProducts) {
        prod.url = prod.url || [];
        if (prod.pImages && prod.pImages.length > 0) {
          for (let j = 0; j < prod.pImages.length; j++) {
            try {
              if (process.env.AWS_ACCESS_KEY) {
                const getObjectParams = {
                  Bucket: process.env.BUCKET_NAME || 'peach13',
                  Key: prod.pImages[j],
                };
                const command = new GetObjectCommand(getObjectParams);
                const signedUrl = await getSignedUrl(s3Client, command);
                prod.url[j] = signedUrl;
              }
            } catch (e) {}
          }
        }
      }

      return res.status(200).json({
        success: true,
        query: query.trim(),
        topic: bestMatch.topic,
        answer: bestMatch.answer,
        weatherAdvisory: bestMatch.weatherNote,
        recommendedProducts: recommendedProducts || [],
        followUps: bestMatch.followUps,
      });
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return res.status(500).json({
        error: "AI Assistant is currently busy. Please try again shortly.",
      });
    }
  }

  async getFeaturedTopics(req, res) {
    try {
      const topics = [
        {
          id: '1',
          title: 'Tomato & Chilli Leaf Curl',
          query: 'How to cure tomato leaf curl virus and whiteflies?',
          icon: 'bug',
          category: 'Crop Protection',
        },
        {
          id: '2',
          title: 'Fertilizer & NPK Dosage',
          query: 'What is the best NPK fertilizer for crop flowering and fruiting?',
          icon: 'sprout',
          category: 'Nutrition',
        },
        {
          id: '3',
          title: 'Monsoon Weather Advisory',
          query: 'Weather and rainfall advice for farming this week',
          icon: 'cloud-rain',
          category: 'Weather',
        },
        {
          id: '4',
          title: 'High-Yield Hybrid Seeds',
          query: 'Recommend best certified hybrid seeds for high yield',
          icon: 'package',
          category: 'Seeds',
        },
        {
          id: '5',
          title: 'Drip & Sprayer Tools',
          query: 'Best battery sprayers and farm machinery for horticulture',
          icon: 'wrench',
          category: 'Machinery',
        },
      ];
      return res.status(200).json({ topics });
    } catch (e) {
      return res.status(500).json({ error: "Failed to fetch topics" });
    }
  }
}

const aiAssistantController = new AIAssistantController();
module.exports = aiAssistantController;


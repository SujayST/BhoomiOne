const productModel = require("../models/products");
const affiliateModel = require("../models/affiliate");


class Affiliate {
  async getAffiliateLinkForProduct(req, res) {
    let { productId, userId } = req.body;
    if (!productId) {
      return res.json({ error: "Product ID unavailable" });
    } else {
      try {
        let products = await productModel.findById(productId)
        if (products) {
          const baseLink = `http://localhost:3000/products/${productId}`;
          const affiliateLink = `${baseLink}?aff_id=${userId}`;
          return res.json({ affiliateLink, userId });
        } else {
          res.status(404).json({ error: "Product not found after if" });
        }
      } catch (err) {
        return res.json({ error: "Product not found" });
      }
    }
  }
  async getAffiliateDetails(req, res) {
    let { affiliateId } = req.body;
    try {
      console.log("aff in controller : ", affiliateId);
      let affiliate = await affiliateModel.find({ affiliateId }).populate('pId', 'name price'); // Include only 'name' and 'price' fields from Product
      if (affiliate) {
        return res.json(affiliate);
      }
      else {
        return res.status(404).json({ message: 'Affiliate not found' });
      }

    } catch (err) {
      console.log(err);
    }

  }

  async setAffiliateData(req, res) {

    try {
      const { pId, affiliateId, pPrice } = req.body;
      console.log("Price of the order : ", pPrice);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Check if a record with the same pId and affiliateId exists
      let existingAffiliate = await affiliateModel.findOne({ pId, affiliateId });
      if (existingAffiliate) {
        if (existingAffiliate.lastUpdated < startOfMonth) {
          existingAffiliate.monthlyOrders = 1; // Reset to 1 since we're counting the current order
          existingAffiliate.monthlyCommission = Math.round(0.2 * pPrice);
        } else {
          existingAffiliate.monthlyOrders += 1; // Increment the monthly orders count
          existingAffiliate.monthlyCommission = Math.round(0.2 * pPrice) * existingAffiliate.monthlyOrders;
        }
        // If it exists, increment the count
        existingAffiliate.count += 1;
        existingAffiliate.lastUpdated = now;
        await existingAffiliate.save();
        console.log("Affiliates (updated): ", existingAffiliate);
      } else {
        // If it does not exist, create a new record with count set to 1
        let newAffiliate = new affiliateModel({
          pId,
          affiliateId,
          count: 1,
          monthlyOrders: 1,
          monthlyCommission: Math.round(0.2 * pPrice),
          totalCommission: Math.round(0.2 * pPrice),
          lastUpdated: now
        });
        await newAffiliate.save();
        console.log("Affiliates (new): ", newAffiliate);
      }
      
      
    } catch (error) {
      console.error('Error in setAffiliateData:', error);
      res.status(500).json({ error: 'Failed to process affiliate data' });
    }
  }
}


const affiliateController = new Affiliate();
module.exports = affiliateController;

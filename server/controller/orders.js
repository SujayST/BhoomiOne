const orderModel = require("../models/orders");
const storeModel = require("../models/stores");
const productModel = require("../models/products")
const userModel = require("../models/users")
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const checkValidCoupons = require("./utils/checkValidCoupons")
const updateCouponForAnalaysis = require("./utils/updateCouponForAnalysis")
const emailService = require("./emailServices")
const shippingController = require("./shippingServices")
const invoice = require("./invoice")
const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


class Order {
  async getAllOrders(req, res) {
    try {
      let Orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "fullname email")
        .sort({ _id: -1 });
      for (let order of Orders) {
        for (let product of order.allProduct) {
          if (product.id && product.id.pImages && product.id.pImages.length > 0) {
            let getObjectParams = {
              Bucket: process.env.BUCKET_NAME,
              Key: product.id.pImages[0],
            };
            let command = new GetObjectCommand(getObjectParams);
            let url = await getSignedUrl(s3Client, command);
            product.id.url = url;
          }
        }
      }
      if (Orders) {
        return res.json({ Orders });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getOrderByUser(req, res) {
    let  uId  = req.userDetails._id;    
    if (!uId) {
      return res.status(403).json({ message: "Unauthorizzed access" });
    } else {
      try {
        let Orders = await orderModel
          .find({ user: uId })
          .populate("allProduct.id", "pName pImages pPrice")
          .populate("store", "sName")
          .populate("user", "fullname email")
          .sort({ _id: -1 });

        for (let order of Orders) {
          for (let product of order.allProduct) {
            if (product.id && product.id.pImages && product.id.pImages.length > 0) {
              let getObjectParams = {
                Bucket: process.env.BUCKET_NAME,
                Key: product.id.pImages[0],
              };
              let command = new GetObjectCommand(getObjectParams);
              let url = await getSignedUrl(s3Client, command);
              product.id.url = url;
            }
          }
        }
        if (Orders) {
          return res.json({ Orders });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getOrderByStore(req, res) {
    const { storename } = req.body;
    try {
      // Find the store based on the store name
      const store = await storeModel.findOne({ sName: storename });

      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Retrieve orders associated with the store ID
      const Orders = await orderModel
        .find({ store: store._id }) // Filter orders by store ID
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .sort({ _id: -1 });

      for (let order of Orders) {
        for (let product of order.allProduct) {
          if (product.id && product.id.pImages && product.id.pImages.length > 0) {
            let getObjectParams = {
              Bucket: process.env.BUCKET_NAME,
              Key: product.id.pImages[0],
            };
            let command = new GetObjectCommand(getObjectParams);
            let url = await getSignedUrl(s3Client, command);
            product.id.url = url;
          }
        }
      }

      return res.json({ Orders });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postCreateOrder(req, res) {
    let { allProduct, userDetails, amount, transactionDetails, address, phone, coupons } = req.body;
    const user = req.userDetails._id;
    if (!allProduct || !user || !amount || !transactionDetails || !address || !phone) {
      return res.json({ message: "All fields are required" });
    } else {
      try {
        let orderIds = [];
        const couponKeys = Object.keys(coupons);
        const globalCoupon = '000000000000100000000000';
        const userHasUsedTheGlobalCoupon = coupons[globalCoupon] !== undefined;
  
        for (var productInfo of allProduct) {
          const product = await productModel.findById(productInfo.id);
  
          // Parse the pQuantity field
          let sizes = JSON.parse(product.pQuantity);
  
          // Find the ordered size and reduce its quantity
          sizes = sizes.map(size => {
            if (size.size === productInfo.size) {
              size.quantity = Math.max(0, size.quantity - productInfo.quantity);
            }
            return size;
          });
  
          // Update the product's pQuantity field
          product.pQuantity = JSON.stringify(sizes);
          await product.save(); // Save the updated product
  
          let newOrder = new orderModel({
            allProduct: productInfo,
            user,
            transactionDetails,
            address,
            phone,
            store: product.pStore,
            amount
          });
  
          // Save the order
          let savedOrder = await newOrder.save();
          orderIds.push(savedOrder._id);
  
          if (coupons[product.pStore] !== undefined) {
            await checkValidCoupons.addCouponsUsedToDb(coupons[product.pStore], user, savedOrder._id);
            await updateCouponForAnalaysis.updateCouponCount(product.pStore, coupons[product.pStore]);
          }
  
          const store = await storeModel.findById(product.pStore).populate('Admin');
          const admin = await userModel.findById(store.Admin);
  
          // Generate invoice and send email
          invoice.generateInvoice(savedOrder, userDetails)
            .then(invoiceKey => {
              savedOrder.invoiceKey = invoiceKey;
              return savedOrder.save();
            })
            .catch(err => console.error("Error generating invoice:", err));
  
          emailService.sendEmailNotification(admin.email, savedOrder, product.pName);
        }
  
        if (userHasUsedTheGlobalCoupon) {
          await checkValidCoupons.addCouponsUsedToDb(coupons[globalCoupon], user, orderIds);
        }
  
        return res.status(200).json({ success: "Orders created successfully" });
      } catch (err) {
        return res.json({ error: err.message });
      }
    }
  }
  


  async postCreateShippment(req, res) {
    let { oId } = req.body;

    if (!oId) {
      console.log("no order id");
      return res.json({ error: "Order ID is required" });
    }

    try {

      const order = await orderModel.findById(oId);

      const userDetails = await userModel.findById(order.user);

      const shippingDetails = await shippingController.createShipping(order, userDetails);

      if (shippingDetails.error) {
        throw new Error("The shipment could not be created");
      }

      order.shippingDetails = shippingDetails;
      order.status = "Processing";
      await order.save();

      return res.status(200).json({ success: "Shipment created and order updated successfully", order });
    } catch (err) {
      return res.json({ error: err.message });
    }
  }



  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      let currentOrder = orderModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now(),
      });
      currentOrder.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "Order updated successfully" });
      });
    }
  }

  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteOrder = await orderModel.findByIdAndDelete(oId);
        if (deleteOrder) {
          return res.json({ success: "Order deleted successfully" });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async postReturnOrder(req, res) {
    let { oId, status } = req.body;
    console.log("status", status, typeof status);
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      const order = await orderModel.findById(oId);
      const product = await productModel.findById(order.allProduct[0].id);
      const store = await storeModel.findById(product.pStore);
      const admin = await userModel.findById(store.Admin);

      order.updatedAt = Date.now();
      order.status = status;
      await order.save();

      emailService.sendEmailNotificationReturn(admin.email, order, product.pName);

      return res.json({ success: "Order updated successfully" });
    }
  }
}


const ordersController = new Order();
module.exports = ordersController;

const fs = require("fs");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const customizeModel = require("../models/customize");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");
const sharp = require("sharp");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Customize {

  async getImages(req, res) {
    try {
      let Images = await customizeModel.find({ device: "desktop" });
      
      for(var image of Images){
        try {
          if (image.slideImage && process.env.AWS_ACCESS_KEY) {
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME || 'peach13',
              Key: image.slideImage,
            };
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            image.url = url;
          }
        } catch (s3Err) {}
      }
      return res.json({ Images: Images || [] });
    } catch (err) {
      console.log(err);
      return res.json({ Images: [] });
    }
  }

  async getImagesMobile(req, res) {
    try {
      let Images = await customizeModel.find({ device: "mobile" });
      for(var image of Images){
        try {
          if (image.slideImage && process.env.AWS_ACCESS_KEY) {
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME || 'peach13',
              Key: image.slideImage,
            };
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            image.url = url;
          }
        } catch (s3Err) {}
      }
      return res.json({ Images: Images || [] });
    } catch (err) {
      console.log(err);
      return res.json({ Images: [] });
    }
  }

  async getImagesByStore(req, res) {
    let { storeId } = req.body;
    if(storeId){
      try {
        if(storeId != "{}"){
          let Images = await customizeModel.find({ cStore: storeId, device: "desktop" });
          for(var image of Images){
            try {
              if (image.slideImage && process.env.AWS_ACCESS_KEY) {
                var getObjectParams ={
                  Bucket: process.env.BUCKET_NAME || 'peach13',
                  Key: image.slideImage,
                };
                var command = new GetObjectCommand(getObjectParams);
                var url = await getSignedUrl(s3Client, command);
                image.url = url;
              }
            } catch (s3Err) {}
          }
          return res.json({ Images: Images || [] });
        }
      } catch (err) {
        console.log(err);
        return res.json({ Images: [] });
      }
    }
    return res.json({ Images: [] });
  }

  async getImagesMobileByStore(req, res) {
    let { storeId } = req.body;
    if(storeId){
      try {
        if(storeId != "{}"){
          let Images = await customizeModel.find({ cStore: storeId, device: "mobile" });
          for(var image of Images){
            try {
              if (image.slideImage && process.env.AWS_ACCESS_KEY) {
                var getObjectParams ={
                  Bucket: process.env.BUCKET_NAME || 'peach13',
                  Key: image.slideImage,
                };
                var command = new GetObjectCommand(getObjectParams);
                var url = await getSignedUrl(s3Client, command);
                image.url = url;
              }
            } catch (s3Err) {}
          }
          return res.json({ Images: Images || [] });
        }
      } catch (err) {
        console.log(err);
        return res.json({ Images: [] });
      }
    }
    return res.json({ Images: [] });
  }

  async deleteImage(file) {
    try {
      const params ={
        Bucket: process.env.BUCKET_NAME || 'peach13',
        Key: file,
      };
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (e) {}
  }

  async uploadSlideImage(req, res) {
    let { device, storeId } = req.body;
    device = device || "mobile";
    storeId = storeId || "market";

    if(!req.file){
      return res.json({ error: "Image is required" });
    }
    
    let randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
    var imageName = randomImageName();
    let buffer = null;

    try {
      if(device == "desktop"){
        buffer = await sharp(req.file.buffer).resize({ height: 443, width: 1503, fit: "cover" }).toBuffer();
      } else {
        buffer = await sharp(req.file.buffer).resize({ height: 540, width: 1080, fit: "cover" }).toBuffer();
      }
    } catch (sharpErr) {
      buffer = req.file.buffer;
    }
    
    let resolvedStoreId = (storeId === "market" || storeId === "null" || !storeId) ? null : storeId;
    
    try {
      let newCustomize = new customizeModel({
        slideImage: imageName,
        device: device,
        cStore: resolvedStoreId,
      });

      await newCustomize.save(async (err) => {
        if (!err) {
          if (buffer) {
            let params = {
              Bucket: process.env.BUCKET_NAME || 'peach13',
              Key: imageName,
              Body: buffer,
              ContentType: req.file.mimetype || 'image/png',
            };
            try {
              await s3Client.send(new PutObjectCommand(params));
              console.log('Slider image uploaded to S3 successfully');
            } catch (err) {
              console.log('S3 slider notice:', err.message);
            }
          }
          return res.json({ success: "Slider Image uploaded successfully", data: newCustomize });
        } else {
          return res.json({ error: "Failed to save slider image" });
        }
      });
    } catch (err) {
      console.log(err);
      return res.json({ error: err.message || "Failed to upload banner" });
    }
  }

  async deleteSlideImage(req, res) {
    let { id } = req.body;
    if (!id) {
      return res.json({ error: "All fields required" });
    } else {
      try {
        let deletedSlideImage = await customizeModel.findById(id);

        let deleteImage = await customizeModel.findByIdAndDelete(id);
        if (deleteImage && deletedSlideImage) {
          try {
            const params ={
              Bucket: process.env.BUCKET_NAME || 'peach13',
              Key: deletedSlideImage.slideImage,
            };
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
          } catch (s3Err) {}
          return res.json({ success: "Image deleted successfully" });
        }
        return res.json({ success: "Image deleted successfully" });
      } catch (err) {
        console.log(err);
        return res.json({ error: "Failed to delete banner" });
      }
    }
  }

  async getAllData(req, res) {
    try {
      let Categories = await categoryModel.find({}).countDocuments ? await categoryModel.countDocuments({}) : await categoryModel.find({}).count();
      let Products = await productModel.find({}).countDocuments ? await productModel.countDocuments({}) : await productModel.find({}).count();
      let Orders = await orderModel.find({}).countDocuments ? await orderModel.countDocuments({}) : await orderModel.find({}).count();
      let Users = await userModel.find({}).countDocuments ? await userModel.countDocuments({}) : await userModel.find({}).count();
      let RecentUsers = await userModel.find({ "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).countDocuments ? await userModel.countDocuments({ "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) : 0;
      let RecentOrders = await orderModel.find({ "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).countDocuments ? await orderModel.countDocuments({ "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) : 0;

      return res.json({
        Categories,
        Products,
        Orders,
        Users,
        RecentUsers,
        RecentOrders,
      });
    } catch (err) {
      console.log(err);
      return res.json({
        Categories: 0,
        Products: 0,
        Orders: 0,
        Users: 0,
      });
    }
  }
}

const customizeController = new Customize();
module.exports = customizeController;

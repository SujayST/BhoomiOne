const { toTitleCase } = require("../config/function");
const categoryModel = require("../models/categories");
const sectionModel = require("../models/sections");
const storeModel = require("../models/stores");
const mongoose = require("mongoose");
const fs = require("fs");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const productModel = require("../models/products");
const sharp = require("sharp");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Category {

  async deleteImage(file) {
    try {
      const params ={
        Bucket: process.env.BUCKET_NAME || 'peach13',
        Key: file,
      };
      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);
    } catch (e) {
      console.log("Error deleting image from S3:", e.message);
    }
  }

  async getAllCategory(req, res) {
    try {
      let Categories = await categoryModel
        .find({})
        .populate("cSection", "_id secName")
        .populate("cStore", "_id sName")
        .sort({ _id: -1 });

      for(var category of Categories){
        try {
          if (category.cImage && process.env.AWS_ACCESS_KEY) {
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME || 'peach13',
              Key: category.cImage,
            };
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            category.url = url;
          }
        } catch (s3Err) {
          // ignore S3 error in dev
        }
      }
      return res.json({ Categories: Categories || [] });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  async getCategoryBySection(req, res) {
    let { secId } = req.body;
    if (!secId) {
      return res.json({ error: "All fields are required" });
    } else {
      try {
        let Categories = await categoryModel
          .find({ cSection: secId })
          .populate("cSection", "_id secName")
          .populate("cStore", "sName");
        for(var category of Categories){
          try {
            if (category.cImage && process.env.AWS_ACCESS_KEY) {
              var getObjectParams ={
                Bucket: process.env.BUCKET_NAME || 'peach13',
                Key: category.cImage,
              };
              var command = new GetObjectCommand(getObjectParams);
              var url = await getSignedUrl(s3Client, command);
              category.url = url;
            }
          } catch (s3Err) {}
        }
        return res.json({ Categories: Categories || [] });
      } catch (err) {
        return res.json({ error: "Search category wrong" });
      }
    }
  }

  async getCategoryByStore(req, res) {
    let { storeId } = req.body;
    if (!storeId) {
      return res.json({ error: "All fields are required" });
    } else {
      try {
        let Categories = await categoryModel
          .find({ cStore: storeId })
          .populate("cSection", "_id secName")
          .populate("cStore", "sName");
        for(var category of Categories){
          try {
            if (category.cImage && process.env.AWS_ACCESS_KEY) {
              var getObjectParams ={
                Bucket: process.env.BUCKET_NAME || 'peach13',
                Key: category.cImage,
              };
              var command = new GetObjectCommand(getObjectParams);
              var url = await getSignedUrl(s3Client, command);
              category.url = url;
            }
          } catch (s3Err) {}
        }
        return res.json({ Categories: Categories || [] });
      } catch (err) {
        return res.json({ error: "Search category wrong" });
      }
    }
  }

  postAddCategory = async (req, res) => {
    let { cName, cDescription, cStatus, cSection, cStore } = req.body;
    console.log("Name of the category : ", cName);
    let cImage = req.file ? req.file.originalname : 'category_default.png';
    
    let randomCatName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
    var catName = randomCatName();

    let buffer = null;
    if (req.file && req.file.buffer) {
      try {
        buffer = await sharp(req.file.buffer).resize({height: 500, width:500, fit: "cover"}).toBuffer();
      } catch (e) {
        buffer = req.file.buffer;
      }
    }
    
    if (!cName || !cDescription || !cStatus || !cSection || !cStore) {
      return res.json({ error: "All fields are required" });
    } else {
      cName = toTitleCase(cName);
      try {
        // Resolve or create section
        let resolvedSectionId = cSection;
        if (!mongoose.Types.ObjectId.isValid(cSection)) {
          let foundSec = await sectionModel.findOne({ secName: cSection });
          if (!foundSec) {
            foundSec = await sectionModel.create({
              secName: cSection,
              secDescription: `${cSection} section for agricultural supplies`,
              secStatus: "Active",
              secImage: "section_default.png",
            });
          }
          resolvedSectionId = foundSec._id;
        } else {
          let foundSec = await sectionModel.findById(cSection);
          if (!foundSec) {
            foundSec = await sectionModel.create({
              secName: "General Agri Section",
              secDescription: "General Agricultural Supplies",
              secStatus: "Active",
              secImage: "section_default.png",
            });
            resolvedSectionId = foundSec._id;
          }
        }

        // Resolve or create store
        let resolvedStoreId = cStore;
        if (!mongoose.Types.ObjectId.isValid(cStore)) {
          let foundStr = await storeModel.findOne({ sName: cStore });
          if (!foundStr) {
            foundStr = await storeModel.create({
              sName: cStore,
              sDescription: "Verified Partner Store",
              sStatus: "Active",
              sImage: "store_default.png",
              sAddress: "Direct Agri Hub",
              sPincode: "110001",
            });
          }
          resolvedStoreId = foundStr._id;
        } else {
          let foundStr = await storeModel.findById(cStore);
          if (!foundStr) {
            foundStr = await storeModel.create({
              sName: "Bhoomi Central Store",
              sDescription: "Verified Partner Store",
              sStatus: "Active",
              sImage: "store_default.png",
              sAddress: "Direct Agri Hub",
              sPincode: "110001",
            });
            resolvedStoreId = foundStr._id;
          }
        }

        let checkCategoryExists = await categoryModel.findOne({ cName: cName, cStore: resolvedStoreId });
        if (checkCategoryExists) {
          return res.json({ error: "Category already exists for this store" });
        } else {
          let newCategory = new categoryModel({
            cName,
            cDescription,
            cStatus,
            cSection: resolvedSectionId,
            cStore: resolvedStoreId,
            cImage: catName,
          });

          await newCategory.save(async (err) => {
            if (!err) {
              if (buffer && req.file) {
                let params = {
                  Bucket: process.env.BUCKET_NAME || 'peach13',
                  Key: catName,
                  Body: buffer,
                  ContentType: req.file.mimetype || 'image/png',
                };
                try {
                  await s3Client.send(new PutObjectCommand(params));
                  console.log('File uploaded successfully to S3');
                } catch (err) {
                  console.log('S3 upload notice:', err.message);
                }
              }
              return res.json({ success: "Category created successfully", category: newCategory });
            } else {
              return res.json({ error: "Failed to save category" });
            }
          });
        }
      } catch (err) {
        console.log(err);
        return res.json({ error: err.message || "Failed to create category" });
      }
    }
  };

  async postEditCategory(req, res) {
    let { cName, cId, cDescription, cStore, cSection, cStatus } = req.body;
    if (!cId || !cDescription || !cStatus) {
      return res.json({ error: "All fields are required" });
    }
    try {
      let updatePayload = {
        cDescription,
        cStatus,
        updatedAt: Date.now(),
      };
      if (cName) updatePayload.cName = toTitleCase(cName);
      if (cStore) updatePayload.cStore = cStore;
      if (cSection) updatePayload.cSection = cSection;

      let editCategory = await categoryModel.findByIdAndUpdate(cId, updatePayload);
      if (editCategory) {
        return res.json({ success: "Category edited successfully" });
      }
      return res.json({ error: "Category not found" });
    } catch (err) {
      console.log(err);
      return res.json({ error: "Failed to edit category" });
    }
  }

  async getDeleteCategory(req, res) {
    let { cId } = req.body;
    if (!cId) {
      return res.json({ error: "Category ID is required" });
    } else {
      try {
        let deletedCategoryFile = await categoryModel.findById(cId);
        if (deletedCategoryFile && deletedCategoryFile.cImage) {
          this.deleteImage(deletedCategoryFile.cImage);
        }
        let deleteCategory = await categoryModel.findByIdAndDelete(cId);
        if (deleteCategory) {
          await productModel.deleteMany({ pCategory: cId });
          return res.json({ success: "Category deleted successfully" });
        }
        return res.json({ error: "Category not found" });
      } catch (err) {
        console.log(err);
        return res.json({ error: "Failed to delete category" });
      }
    }
  }
}

const categoryController = new Category();
module.exports = categoryController;

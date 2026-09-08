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
      if (file && process.env.AWS_ACCESS_KEY) {
        const params = {
          Bucket: process.env.BUCKET_NAME || 'peach13',
          Key: file,
        };
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      }
    } catch (e) {
      console.log("Error deleting image from S3:", e.message);
    }
  }

  async populateCategoryImages(category) {
    category.urls = category.urls || [];
    try {
      if (process.env.AWS_ACCESS_KEY) {
        // Sign primary image
        if (category.cImage) {
          const getObjectParams = {
            Bucket: process.env.BUCKET_NAME || 'peach13',
            Key: category.cImage,
          };
          const command = new GetObjectCommand(getObjectParams);
          const url = await getSignedUrl(s3Client, command);
          category.url = url;
          if (category.urls.length === 0) {
            category.urls.push(url);
          }
        }

        // Sign all multiple images
        if (category.cImages && category.cImages.length > 0) {
          const signedUrls = [];
          for (const imgKey of category.cImages) {
            try {
              const getObjectParams = {
                Bucket: process.env.BUCKET_NAME || 'peach13',
                Key: imgKey,
              };
              const command = new GetObjectCommand(getObjectParams);
              const signedUrl = await getSignedUrl(s3Client, command);
              signedUrls.push(signedUrl);
            } catch (err) {}
          }
          if (signedUrls.length > 0) {
            category.urls = signedUrls;
            if (!category.url) category.url = signedUrls[0];
          }
        }
      }
    } catch (s3Err) {}
  }

  async getAllCategory(req, res) {
    try {
      let Categories = await categoryModel
        .find({})
        .populate("cSection", "_id secName")
        .populate("cStore", "_id sName")
        .sort({ _id: -1 });

      for (var category of Categories) {
        await this.populateCategoryImages(category);
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
        for (var category of Categories) {
          await this.populateCategoryImages(category);
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
        for (var category of Categories) {
          await this.populateCategoryImages(category);
        }
        return res.json({ Categories: Categories || [] });
      } catch (err) {
        return res.json({ error: "Search category wrong" });
      }
    }
  }

  postAddCategory = async (req, res) => {
    let { cName, cDescription, cStatus, cSection, cStore } = req.body;
    
    // Accept multiple files from upload.any() or upload.single()
    const files = req.files || (req.file ? [req.file] : []);

    if (!cName || !cDescription || !cStatus || !cSection || !cStore) {
      return res.json({ error: "All fields are required" });
    }

    if (!files || files.length === 0) {
      return res.json({ error: "At least one category image is mandatory" });
    }

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
      }

      // Process multiple images for S3 upload
      const allImageKeys = [];
      const imageBuffers = [];

      for (let i = 0; i < files.length; i++) {
        let randomKey = crypto.randomBytes(32).toString('hex');
        allImageKeys.push(randomKey);

        let buffer = null;
        if (files[i].buffer) {
          try {
            buffer = await sharp(files[i].buffer).resize({ height: 500, width: 500, fit: "cover" }).toBuffer();
          } catch (e) {
            buffer = files[i].buffer;
          }
        }
        imageBuffers.push({ buffer, mimetype: files[i].mimetype, key: randomKey });
      }

      let newCategory = new categoryModel({
        cName,
        cDescription,
        cStatus,
        cSection: resolvedSectionId,
        cStore: resolvedStoreId,
        cImage: allImageKeys[0],
        cImages: allImageKeys,
      });

      await newCategory.save(async (err, savedCat) => {
        if (!err) {
          // Upload all images to S3
          for (const item of imageBuffers) {
            if (item.buffer) {
              let params = {
                Bucket: process.env.BUCKET_NAME || 'peach13',
                Key: item.key,
                Body: item.buffer,
                ContentType: item.mimetype || 'image/png',
              };
              try {
                await s3Client.send(new PutObjectCommand(params));
                console.log(`Category image ${item.key} uploaded to S3 successfully`);
              } catch (err) {
                console.log('S3 category upload notice:', err.message);
              }
            }
          }
          return res.json({ success: "Category created successfully!", category: savedCat });
        } else {
          return res.json({ error: "Failed to save category" });
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  postEditCategory = async (req, res) => {
    let { cId, cDescription, cStatus } = req.body;
    if (!cId || !cDescription || !cStatus) {
      return res.json({ error: "All fields are required" });
    }
    try {
      let edit = await categoryModel.findByIdAndUpdate(cId, {
        cDescription,
        cStatus,
        updatedAt: Date.now(),
      });
      if (edit) {
        return res.json({ success: "Category edited successfully" });
      }
    } catch (err) {
      console.log(err);
      return res.json({ error: "Failed to edit category" });
    }
  };

  getDeleteCategory = async (req, res) => {
    let { cId } = req.body;
    if (!cId) {
      return res.json({ error: "All fields are required" });
    } else {
      try {
        let category = await categoryModel.findById(cId);
        let deletedCategory = await categoryModel.findByIdAndDelete(cId);
        if (deletedCategory) {
          // Delete from S3
          if (category.cImage) {
            await this.deleteImage(category.cImage);
          }
          if (category.cImages && category.cImages.length > 0) {
            for (const imgKey of category.cImages) {
              await this.deleteImage(imgKey);
            }
          }
          return res.json({ success: "Category deleted successfully" });
        }
      } catch (err) {
        console.log(err);
        return res.json({ error: "Failed to delete category" });
      }
    }
  };
}

const categoryController = new Category();
module.exports = categoryController;

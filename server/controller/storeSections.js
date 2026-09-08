const { toTitleCase } = require("../config/function");
const fs = require("fs");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const productModel = require("../models/products");
const storeSectionModel = require("../models/storeSections");
const categoryModel = require("../models/categories");
const sectionModel = require("../models/sections");
const storeModel = require("../models/stores");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class StoreSection {

  async deleteImage(file) {
    const params ={
      Bucket: 'peach13',
      Key: file,
    }
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  }

  async getAllStoreSection(req, res) {
    try {
      let StoreSections = await storeSectionModel
      .find({})
      .sort({ _id: -1 });
      for(var storeSection of StoreSections){
        var getObjectParams ={
          Bucket: process.env.BUCKET_NAME,
          Key: storeSection.ssImage,
        }
        var command = new GetObjectCommand(getObjectParams);
        var url = await getSignedUrl(s3Client, command);
        storeSection.url = url
      }
      if (StoreSections) {
        return res.json({ StoreSections });
      }
    } catch (err) {
      console.log(err);
    }
  }

  postAddStoreSection = async (req, res) => {
    let { ssName, ssDescription, ssStatus } = req.body;
    let ssImage = req.file.originalname;

    let randomStSecName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

    var storeSectionName = randomStSecName();
    
    if (!ssName || !ssDescription || !ssStatus || !ssImage ) {
      this.deleteImage(ssImage, 'file');
        return res.json({ error: "All filled are required" });
    } else {
      ssName = toTitleCase(ssName);
      try {
        let checkStoreSectionExists = await storeSectionModel.findOne({ ssName: ssName });
        if (checkStoreSectionExists) {
          this.deleteImage(ssImage, 'file');
          return res.json({ error: "StoreSection already exists" });
        } else {
          let newStoreSection = new storeSectionModel({
            ssName,
            ssDescription,
            ssStatus,
            ssImage: storeSectionName,
          });
          newStoreSection.save(async (err) => {
            if (!err) {
              let params = {
                Bucket: 'peach13',
                Key: storeSectionName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
              };
              try {
                await s3Client.send(new PutObjectCommand(params));
                console.log('File uploaded successfully');
              } catch (err) {
                console.error(err);
              }
              return res.json({ success: "StoreSection created successfully" });
            }
            else{
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postEditStoreSection(req, res) {
    let { ssName, ssId, ssDescription,  ssStatus } = req.body;
    if (!ssName || !ssId || !ssDescription || !ssStatus) {
      return res.json({ error: "All filled must be required" });
    }
    try {
      let editStoreSection = storeSectionModel.findByIdAndUpdate(ssId, {
        ssName,
        ssDescription,
        ssStore,
        ssStatus,
        updatedAt: Date.now(),
      });
      let edit = await editStoreSection.exec();
      if (edit) {
        return res.json({ success: "StoreSection edit successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getDeleteStoreSection(req, res) {
    let { ssId } = req.body;
    if (!ssId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        const stores = await storeModel.find({ sSection : ssId}); 
        stores.forEach(async(element)  => {
          const sections = await sectionModel.find({ secStore : element._id}); 
          sections.forEach(async(element1)  => {
            const categories = await categoryModel.find({ cSection : element1._id}); 
            categories.forEach(async(ele1)  => {

              const products = await productModel.find({ pCategory : ele1._id}); 
              products.forEach(async(ele)  => {
                let deleteProductObj = await productModel.findById(ele._id);
                let deleteProduct = await productModel.findByIdAndDelete(ele._id);
                if (deleteProduct) {
                  // Delete Image from uploads -> products folder
                  // Category.deleteImage(deleteProductObj.pImages);
                  for( let image in deleteProductObj.pImages ){
                    const params ={
                      Bucket: 'peach13',
                      Key: image,
                    }
                    const command = new DeleteObjectCommand(params);
                    await s3Client.send(command);
                  }  
                }
              });
              
              let deleteCatFile = await categoryModel.findById(ele1._id);
              let deleteCategory = await categoryModel.findByIdAndDelete(ele1._id);
              if (deleteCategory) {
                // Delete Image from S3 Bucket
                const params ={
                  Bucket: 'peach13',
                  Key: deleteCatFile.cImage,
                }
                const command = new DeleteObjectCommand(params);
                await s3Client.send(command);
              }
            });

            let deleteSecFile = await sectionModel.findById(element1._id);
            let deleteSection = await sectionModel.findByIdAndDelete(element1._id);
            if (deleteSection) {
              // Delete Image from S3 Bucket
              const params ={
                Bucket: 'peach13',
                Key: deleteSecFile.secImage,
              }
              const command = new DeleteObjectCommand(params);
              await s3Client.send(command);
            }
          });

          let deleteStoreFile = await storeModel.findById(element._id);
          let deleteStore = await storeModel.findByIdAndDelete(element._id);
          if (deleteStore) {
            // Delete Image from S3 Bucket
            const params ={
              Bucket: 'peach13',
              Key: deleteStoreFile.sImage,
            }
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
          }
        });


        let deletedStoreSectionFile = await storeSectionModel.findById(ssId);
        let deleteStoreSection = await storeSectionModel.findByIdAndDelete(ssId);
        if (deleteStoreSection) {
          // Delete Image from S3 Bucket
          const params ={
            Bucket: 'peach13',
            Key: deletedStoreSectionFile.secImage,
          }
          const command = new DeleteObjectCommand(params);
          await s3Client.send(command);
        
          return res.json({ success: "Store Section deleted successfully" });
         
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const storeSectionController = new StoreSection();
module.exports = storeSectionController;
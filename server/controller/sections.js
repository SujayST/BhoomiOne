const { toTitleCase } = require("../config/function");
const fs = require("fs");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const productModel = require("../models/products");
const sectionModel = require("../models/sections");
const categoryModel = require("../models/categories");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Section {

  async deleteImage(file) {
    const params ={
      Bucket: 'peach13',
      Key: file,
    }
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
  }

  async getAllSection(req, res) {
    try {
      let Sections = await sectionModel
      .find({})
      .populate("secStore", "_id sName")
      .sort({ _id: -1 });
      for(var section of Sections){
        var getObjectParams ={
          Bucket: process.env.BUCKET_NAME,
          Key: section.secImage,
        }
        var command = new GetObjectCommand(getObjectParams);
        var url = await getSignedUrl(s3Client, command);
        section.url = url
      }
      if (Sections) {
        return res.json({ Sections });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getSectionByStore(req, res) {
    let {storeId } = req.body;
    if (!storeId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let Sections = await sectionModel
          .find({ secStore: storeId })
          .populate("secStore", "sName");
          for(var section of Sections){
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME,
              Key: section.secImage,
            }
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            section.url = url;
          }
        if (Sections) {
          return res.json({ Sections });
        }
      } catch (err) {
        return res.json({ error: "Search section wrong" });
      }
    }
  }

  postAddSection = async (req, res) => {
    let { secName, secDescription, secStatus, secStore } = req.body;
    let secImage = req.file.originalname;

    let randomSecName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

    var sectionName = randomSecName();
    
    if (!secName || !secDescription || !secStatus || !secImage || !secStore) {
      this.deleteImage(secImage, 'file');
        return res.json({ error: "All filled are required" });
    } else {
      secName = toTitleCase(secName);
      try {
        let checkSectionExists = await sectionModel.findOne({ secName: secName, secStore: secStore});
        if (checkSectionExists) {
          this.deleteImage(secImage, 'file');
          return res.json({ error: "Section already exists" });
        } else {
          let newSection = new sectionModel({
            secName,
            secDescription,
            secStatus,
            secStore,
            secImage: sectionName,
          });
          newSection.save(async (err) => {
            if (!err) {
              let params = {
                Bucket: 'peach13',
                Key: sectionName,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
              };
              console.log("line_114");
              try {
                await s3Client.send(new PutObjectCommand(params));
                console.log('File uploaded successfully');
              } catch (err) {
                console.error(err);
              }
              return res.json({ success: "Section created successfully" });
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

  async postEditSection(req, res) {
    let { secName, secId, secDescription, secStore, secStatus } = req.body;
    if (!secName || !secId || !secDescription ||!secStore || !secStatus) {
      return res.json({ error: "All filled must be required" });
    }
    try {
      let editSection = sectionModel.findByIdAndUpdate(secId, {
        secName,
        secDescription,
        secStore,
        secStatus,
        updatedAt: Date.now(),
      });
      let edit = await editSection.exec();
      if (edit) {
        return res.json({ success: "Section edit successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getDeleteSection(req, res) {
    let { secId } = req.body;
    if (!secId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        const categories = await categoryModel.find({ cSection : secId}); 
        categories.forEach(async(element)  => {
          const products = await productModel.find({ pCategory : element._id}); 
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
          


          let deleteCatFile = await categoryModel.findById(element._id);
          let deleteCategory = await categoryModel.findByIdAndDelete(element._id);
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


        let deletedSectionFile = await sectionModel.findById(secId);
        let deleteSection = await sectionModel.findByIdAndDelete(secId);
        if (deleteSection) {
          // Delete Image from S3 Bucket
          const params ={
            Bucket: 'peach13',
            Key: deletedSectionFile.secImage,
          }
          const command = new DeleteObjectCommand(params);
          await s3Client.send(command);
        
          return res.json({ success: "Section deleted successfully" });
         
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const sectionController = new Section();
module.exports = sectionController;
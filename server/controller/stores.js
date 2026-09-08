const { toTitleCase } = require("../config/function");
const storeModel = require("../models/stores");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sectionModel = require("../models/sections");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const sharp = require("sharp");
const { Validator } = require('format-utils');

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


class Store {
  async getAllStore(req, res) {
    try {
      let Stores = await storeModel
      .find({})
      .populate("Admin","_id fullname")
      .populate("sSection","_id ssName")
      .sort({ _id: -1 });
      for(var store of Stores){
        var getObjectParams ={
          Bucket: process.env.BUCKET_NAME,
          Key: store.sImage,
        }
        var command = new GetObjectCommand(getObjectParams);
        var url = await getSignedUrl(s3Client, command);
        store.url = url
      }
      if (Stores) {
        return res.json({ Stores });
      }
    } catch (err) {
      console.log(err);
    }
  }
  async getStore(req, res) {
    let { sName} = req.body;
    try {
      let Store = await storeModel.findOne({ sName });
      var getObjectParams ={
        Bucket: process.env.BUCKET_NAME,
        Key: Store.sImage,
      }
      var command = new GetObjectCommand(getObjectParams);
      var url = await getSignedUrl(s3Client, command);
      Store.url = url
      if (Store) {
        const storeData = {
          sName: Store.sName,
          _id: Store._id,
          url: Store.url,
          sDescription: Store.sDescription
      };
      return res.json({Store:storeData});
      }else{
        return res.json(null);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postAddStore(req, res,next) {

    let { sName, GST, sDescription, sAddress, sPincode, sSection, commisionRate, sInvoceCount, sStatus, Admin } = req.body;
    console.log("files:", req.files);
    let sImage = req.files[0];
    let sSignature = req.files[1];
    if(req.files && req.files.length>2){
      let randomStoreLogo = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
      var storeLogo = randomStoreLogo();
    }else{
      let storeLogo = null;
    }

    let randomStoreImage = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
    let randomStoreSignature = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

    var storeImage = randomStoreImage();
    var storeSignature = randomStoreSignature();


    if (!sName || !sDescription || !GST || !sAddress || !sStatus || !sSection || !sImage || !sSignature || !Admin) {
      return res.json({ error: "All filled must be required" });
    } else if(!sPincode || sPincode < 100000 || sPincode > 1000000){
        return res.json({ error: "Please enter a valid 6 digit Pincode" });
    } else if(!Validator.gst(GST)){
        return res.json({ error: "Please enter a valid GSTIN" });
    } else {
      sName = toTitleCase(sName);
      try {
        let checkStoreExists = await storeModel.findOne({ sName: sName });
        if (checkStoreExists) {
            return res.json({ error: "Store already exists" });
        } else {
          let newStore = new storeModel({
            sName,
            Admin,
            sDescription,
            GST,
            sAddress,
            sPincode,
            sSection,
            sInvoceCount,
            commisionRate,
            sSignature: storeSignature,
            sLogo: storeLogo,
            sImage: storeImage,
            sStatus,
          });
          await newStore.save(async (err) => {
            if (!err) {
              let buffer= await sharp(req.files[0].buffer).resize({height: 1200, width:1125, fit: "cover"}).toBuffer();
              let buffer1= await sharp(req.files[1].buffer).resize({ fit: "cover"}).toBuffer();

              let params = {
                Bucket: 'peach13',
                Key: storeImage,
                Body: buffer,
                ContentType: req.files[0].mimetype,
              };
              try {
                await s3Client.send(new PutObjectCommand(params));
                console.log('StoreImage uploaded successfully');
              } catch (err) {
                console.error(err);
              }
              let params1 = {
                Bucket: 'peach13',
                Key: storeSignature,
                Body: buffer1,
                ContentType: req.files[1].mimetype,
              };
              try {
                await s3Client.send(new PutObjectCommand(params1));
                console.log('StoreSignature uploaded successfully');
              } catch (err) {
                console.error(err);
              }
              if(req.files.length>2){
                let buffer= await sharp(req.files[2].buffer).resize({ fit: "cover"}).toBuffer();
                let params = {
                  Bucket: 'peach13',
                  Key: storeLogo,
                  Body: buffer,
                  ContentType: req.files[2].mimetype,
                };
                try {
                  await s3Client.send(new PutObjectCommand(params));
                  console.log('StoreLogo uploaded successfully');
                } catch (err) {
                  console.error(err);
                }
              }
              return next()
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postEditStore(req, res) {
    let { sName, sId, sImage, sDescription, sSection, sStatus, Admin } = req.body;
    let editImage = null;
    if( req.file && req.file.originalname ){
       editImage = req.file.originalname;
    }
    console.log("req:",req.body)


    if (!sId || !sDescription || !sStatus || !sSection || !sName || !Admin) {

      return res.json({ error: "All filled must be required" });
    }
    try {
      let editData = {
        sName,
        sDescription,
        sStatus,
        sSection,
        Admin: Admin,
        updatedAt: Date.now(),
      }
      if (editImage){
        let randomProdName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
        var prodName = randomProdName();
        const params ={
          Bucket: 'peach13',
          Key: sImage,
        }
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        let buffer= await sharp(req.file.buffer).resize({height: 1200, width:1125, fit: "cover"}).toBuffer();
        let params1 = {
          Bucket: 'peach13',
          Key: prodName,
          Body:buffer,
          ContentType: editImage.mimetype,
        };
        try {
          await s3Client.send(new PutObjectCommand(params1));
          console.log('File uploaded successfully');
        } catch (err) {
          console.error(err);
        }
        editData = {...editData, sImage: prodName};
      }
      let editStore = storeModel.findByIdAndUpdate(sId, editData);
      let edit = await editStore.exec();
      if (edit) {
        return res.json({ success: "Store edit successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getStoreByStoreSection(req, res) {
    let {ssId } = req.body;
    try {
      let Stores = await storeModel
      .find({sSection : ssId})
      .populate("Admin","_id fullname")
      .sort({ _id: -1 });
      for(var store of Stores){
        var getObjectParams ={
          Bucket: process.env.BUCKET_NAME,
          Key: store.sImage,
        }
        var command = new GetObjectCommand(getObjectParams);
        var url = await getSignedUrl(s3Client, command);
        store.url = url
      }
      if (Stores) {
        return res.json({ Stores });
      }
    } catch (err) {
      console.log(err);
    }

  }

  async getDeleteStore(req, res) {
    //TODO change role of admin to 0 when store is deleted
    let { sId } = req.body;
    if (!sId) {
      return res.json({ error: "Invalid StoreID!" });
    } else {
      try {
        const sections = await sectionModel.find({ secStore : sId}); 
        sections.forEach(async(element)  => {
          const categories = await categoryModel.find({ cSection : element._id}); 
          categories.forEach(async(ele1)  => {
            const products = await productModel.find({ pCategory : ele1._id}); 
            products.forEach(async(ele)  => {
              let deleteProductObj = await productModel.findById(ele._id);
              let deleteProduct = await productModel.findByIdAndDelete(ele._id);
              if (deleteProduct) {
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

          let deleteSectionObj = await sectionModel.findById(element._id);
          let deleteSection = await sectionModel.findByIdAndDelete(element._id);
          if (deleteSection) {
            for( let image in deleteSectionObj.secImages ){
              const params ={
                Bucket: 'peach13',
                Key: image,
              }
              const command = new DeleteObjectCommand(params);
              await s3Client.send(command);
            }  
          }
        });

        let deletedStoreFile = await storeModel.findById(sId);
        let deleteStore = await storeModel.findByIdAndDelete(sId);
        if (deleteStore) {
          // Delete Image from uploads -> stores folder 
          const params ={
            Bucket: 'peach13',
            Key: deletedStoreFile.sImage,
          }
          const command = new DeleteObjectCommand(params);
          await s3Client.send(command);
          const params1 ={
            Bucket: 'peach13',
            Key: deletedStoreFile.sSignature,
          }
          const command1 = new DeleteObjectCommand(params1);
          await s3Client.send(command1);
          if(deletedStoreFile.sLogo){
            const params2 ={
              Bucket: 'peach13',
              Key: deletedStoreFile.sLogo,
            }
            const command2 = new DeleteObjectCommand(params2);
            await s3Client.send(command2);
          }
          return res.json({ success: "Store deleted successfully" });
          
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const storeController = new Store();
module.exports = storeController;

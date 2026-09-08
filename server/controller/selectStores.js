const { toTitleCase } = require("../config/function");
const storeModel = require("../models/stores");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sectionModel = require("../models/sections");
const categoryModel = require("../models/categories");
const productModel = require("../models/products");
const sharp = require("sharp");
const selectStoreModel = require("../models/selectStores");
const { getUrl } = require("../middleware/auth");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


class SelectStore {

  async getAllStore(req, res) {
    try {
      let Stores = await selectStoreModel
      .find({})
      .populate("store1","_id sName sImage")
      .populate("store2","_id sName sImage")
      .populate("store3","_id sName sImage")
      .populate("store4","_id sName sImage")

      for(var store of Stores){
        if(store.store1){
          store.store1.url = await getUrl(store.store1.sImage);
        }
        if(store.store2){
          store.store2.url = await getUrl(store.store2.sImage);
        }
        if(store.store3){
          store.store3.url = await getUrl(store.store3.sImage);
        }
        if(store.store4){
          store.store4.url = await getUrl(store.store4.sImage); 
        }
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

  async postAddQuadrant(req, res,next) {

    let { sectionName, store1, store2, store3, store4 } = req.body;
    console.log("line77:",sectionName);
    store1 = JSON.parse(store1)? JSON.parse(store1).sId : null;;
    store2 = JSON.parse(store2)? JSON.parse(store2).sId : null;
    store3 = JSON.parse(store3) ? JSON.parse(store3).sId : null;
    store4 = JSON.parse(store4) ? JSON.parse(store4).sId : null;
    sectionName = toTitleCase(sectionName);
    try {
      let checkStoreExists = await selectStoreModel.findOne({ sectionName: sectionName });
      if (checkStoreExists) {
        console.log(checkStoreExists);
        try {
          let editQuadrant = selectStoreModel.findByIdAndUpdate(checkStoreExists._id, {
            sectionName,
            store1,
            store2,
            store3,
            store4,
            sStatus: "active"
          });
          editQuadrant.exec((err) => {
            if (err) console.log(err);
            return res.json({ success: "Quadrant edited successfully" });
          });
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log("line85:",store1);
        let newQuadrant = new selectStoreModel({
          sectionName,
          store1,
          store2,
          store3,
          store4,
          sStatus: "active"
        });
        newQuadrant.save(async (err) => {
          if (!err) {
            console.log('Quadrant created successfully');
          }else {
            console.log(err)
          }
        });
      }
    } catch (err) {
      console.log(err);
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

const selectStoreController = new SelectStore();
module.exports = selectStoreController;

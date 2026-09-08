const categoryModel = require("../models/categories");
const sectionModel = require("../models/sections");
const storeModel = require("../models/stores");
const mongoose = require("mongoose");
const productModel = require("../models/products");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const fs = require("fs");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { log } = require("console");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Product {
  // Delete Image from uploads -> products folder
  async deleteImages(images) {
    for( let image in images ){
      try {
        const params ={
          Bucket: process.env.BUCKET_NAME || 'peach13',
          Key: image,
        };
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      } catch (e) {}
    }  
  }
  async getAllProduct(req, res) {
    try {
      var Products = await productModel
        .find({})
        .populate("pCategory", "_id cName")
        .populate("pStore", "_id sName")
        .sort({ _id: -1 });
      for (let i= 0; i < Products.length; i++){
        Products[i].url = Products[i].url || [];
        if (Products[i].pImages) {
          for(let j=0; j< Products[i].pImages.length; j++){
            try {
              if (process.env.AWS_ACCESS_KEY) {
                var getObjectParams ={
                  Bucket: process.env.BUCKET_NAME || 'peach13',
                  Key: Products[i].pImages[j],
                };
                var command = new GetObjectCommand(getObjectParams);
                var url = await getSignedUrl(s3Client, command);
                Products[i].url[j] = url;
              }
            } catch (s3Err) {}
          }
        }
      }
      return res.json({ Products: Products || [] });
    } catch (err) {
      console.log(err);
      return res.json({ error: err.message, Products: [] });
    }
  }

  async getSingleProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        console.log("ID:", pId);
        let singleProduct = await productModel
          .findById(pId)
          .populate("pCategory", "cName")
          .populate("pStore", "_id sName")
          .populate("pRatingsReviews.user", "name email userImage");
        console.log("line_68: ", singleProduct.pName);  
        if(singleProduct && singleProduct.pImages){
          for (let i= 0; i < singleProduct.pImages.length; i++){
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME,
              Key: singleProduct.pImages[i],
            }
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            singleProduct.url[i] = url;
          }
          let parsedList = null;
          if(singleProduct.similarProducts){
            parsedList = JSON.parse(singleProduct.similarProducts); 
            if(typeof(parsedList)!="string"){
              for(let j=0; j < parsedList.length; j++){
                let parsedObj = parsedList[j]
                var getObjectParams ={
                  Bucket: process.env.BUCKET_NAME,
                  Key:parsedObj.image[0],
                }
                var command = new GetObjectCommand(getObjectParams);
                parsedList[j].url = await getSignedUrl(s3Client, command);
              }
            }
            singleProduct.similarProducts = JSON.stringify(parsedList)
          }
         
          if (singleProduct) {
            return res.json({ Product: singleProduct });
          }
        }
        
      } catch (err) {
        console.log(err);
      }
    }
  }
  
  async getSingleProductForLink(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let singleProduct = await productModel.findById(pId);
        for (let i= 0; i < singleProduct.pImages.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: singleProduct.pImages[i],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          singleProduct.url[i] = url;
        }
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProductName(req, res) {
    let { pName } = req.body;
    if (!pName) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let singleProduct = await productModel
          .find({pName})
          for (let i= 0; i < singleProduct.pImages.length; i++){
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME,
              Key: singleProduct.pImages[i],
            }
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            singleProduct.url[i] = url;
          }
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postAddProduct(req, res) {
    let {
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pSection,
      similarProducts,
      pStore,
      pOffer,
      pStatus,
    } = req.body;
    let images = req.files;
    console.log("body:", req.body);
    // Validation
    if (
      !pName ||
      !pDescription ||
      !pPrice ||
      !pQuantity ||
      !pCategory ||
      !pSection ||
      !pStore ||
      !pStatus
    ) {
      return res.json({ error: "All fields must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: "Name 255 & Description must not be 3000 character long",
      });
    }
    else {
      try {
        let allImages = [];
        if (images && images.length > 0) {
          for (const img of images) {
            let randomProdName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
            var prodName = randomProdName();
            allImages.push(prodName);
          }
        } else {
          allImages = ['product_default_1.png', 'product_default_2.png'];
        }

        // Resolve or auto-create section
        let resolvedSectionId = pSection;
        if (!mongoose.Types.ObjectId.isValid(pSection)) {
          let foundSec = await sectionModel.findOne({ secName: pSection });
          if (!foundSec) {
            foundSec = await sectionModel.create({
              secName: pSection,
              secDescription: `${pSection} supplies`,
              secStatus: "Active",
              secImage: "section_default.png",
            });
          }
          resolvedSectionId = foundSec._id;
        }

        // Resolve or auto-create store
        let resolvedStoreId = pStore;
        if (!mongoose.Types.ObjectId.isValid(pStore)) {
          let foundStr = await storeModel.findOne({ sName: pStore });
          if (!foundStr) {
            foundStr = await storeModel.create({
              sName: pStore,
              sDescription: "Verified Partner Store",
              sStatus: "Active",
              sImage: "store_default.png",
              sAddress: "Direct Agri Hub",
              sPincode: "110001",
            });
          }
          resolvedStoreId = foundStr._id;
        }

        // Resolve or auto-create category
        let resolvedCategoryId = pCategory;
        if (!mongoose.Types.ObjectId.isValid(pCategory)) {
          let foundCat = await categoryModel.findOne({ cName: pCategory });
          if (!foundCat) {
            foundCat = await categoryModel.create({
              cName: pCategory,
              cDescription: `${pCategory} items`,
              cStatus: "Active",
              cSection: resolvedSectionId,
              cStore: resolvedStoreId,
              cImage: "category_default.png",
            });
          }
          resolvedCategoryId = foundCat._id;
        }

        let newProduct = new productModel({
          pImages: allImages,
          pName,
          pDescription,
          pPrice: Number(pPrice) || 0,
          pQuantity: typeof pQuantity === 'string' ? pQuantity : JSON.stringify(pQuantity),
          similarProducts: similarProducts || [],
          pStore: resolvedStoreId,
          pCategory: resolvedCategoryId,
          pSection: resolvedSectionId,
          pOffer: pOffer || "0",
          pStatus: pStatus || "Active",
        });

        await newProduct.save(async (err, result) => {
          if (!err) {
            if (images && images.length > 0) {
              for (let i = 0; i < images.length; i++) {
                try {
                  let buffer = await sharp(images[i].buffer).resize({ height: 1200, width: 1125, fit: "cover" }).toBuffer();
                  let params = {
                    Bucket: process.env.BUCKET_NAME || 'peach13',
                    Key: allImages[i],
                    Body: buffer,
                    ContentType: images[i].mimetype || 'image/png',
                  };
                  await s3Client.send(new PutObjectCommand(params));
                } catch (err) {
                  console.log('S3 product upload notice:', err.message);
                }
              }
            }
            console.log("Product creation successful!");
            return res.json({ success: "Product creation successful!", data: result });
          } else {
            console.log("Error:", err);
            return res.json({ error: "Product creation failed!" });
          }
        });
      } catch (err) {
        console.log(err);
        return res.json({ error: err.message || "Product creation failed!" });
      }
    }
  }

  async postEditProduct(req, res) {
    let {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      similarProducts,
      pStore,
      pOffer,
      pStatus,
      pImages,
    } = req.body;
    let editImages = req.files;
    console.log("ID:",pId, " pImages:",pImages);
    console.log("editImages:",editImages);
    pImages = JSON.parse(pImages)
    // Validate other fileds
    if (
      !pId |
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pStore|
      !pOffer |
      !pStatus
    ) {
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    } 
    // Validate Update Images
    else if (editImages && editImages.length == 1) {
      Product.deleteImages(editImages, 'file');
      return res.json({ error: "Must need to provide 2 images" });
    } else {
      let editData = {
        pName,
        pDescription,
        pPrice,
        pQuantity,
        pCategory,
        similarProducts,
        pStore,
        pOffer,
        pStatus,
        pImages
      }
      if (editImages.length >= 2) {
        let allEditImages = [];
        for (const img of editImages) {
          let randomProdName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
          var prodName = randomProdName();
          allEditImages.push(prodName);
        }
        for( let image in pImages ){
          const params ={
            Bucket: 'peach13',
            Key: image,
          }
          const command = new DeleteObjectCommand(params);
          await s3Client.send(command);
        }
        for(let i=0; i< allEditImages.length; i++){
          let buffer= await sharp(editImages[i].buffer).resize({height: 1200, width:1125, fit: "cover"}).toBuffer();
          let params = {
            Bucket: 'peach13',
            Key: allEditImages[i],
            Body:buffer,
            ContentType: editImages[i].mimetype,
          };
          try {
            await s3Client.send(new PutObjectCommand(params));
            console.log('File uploaded successfully');
          } catch (err) {
            console.error(err);
          }
        }
        editData = {...editData, pImages: allEditImages};
      }
      console.log("line297:",editData.pImages);
      try {
        let editProduct = productModel.findByIdAndUpdate(pId, editData);
        editProduct.exec((err) => {
          if (err) console.log(err);
          return res.json({ success: "Product edit successfully" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteProductObj = await productModel.findById(pId);
        let deleteProduct = await productModel.findByIdAndDelete(pId);
        if (deleteProduct) {
          // Delete Image from uploads -> products folder
          for( let image in deleteProductObj.pImages ){
            const params ={
              Bucket: 'peach13',
              Key: image,
            }
            const command = new DeleteObjectCommand(params);
            await s3Client.send(command);
          }  
          return res.json({ success: "Product deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  

  async getProductByCategory(req, res) {
    let { catId } = req.body;
    if (!catId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pCategory: catId })
          .populate("pCategory", "cName");
        for (let i= 0; i < products.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: products[i].pImages[0],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          products[i].url = url
        }
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }
  async getProductBySection(req, res) {
    let { secId } = req.body;
    if (!secId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pSection: secId })
          .populate("pSection", "secName");
        for (let i= 0; i < products.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: products[i].pImages[0],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          products[i].url = url
        }
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }
  async getProductByStore(req, res) {
    let {storeId } = req.body;
    if (!storeId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pStore: storeId })
          .populate("pStore", "sName")
          .populate("pCategory", "_id cName")
          // .populate("pStore", "_id sName")
          .sort({ _id: -1 });
        for (let i= 0; i < products.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: products[i].pImages[0],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          products[i].url = url
        }
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    if (!price) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pPrice: { $lt: price } })
          .populate("pCategory", "cName")
          .sort({ pPrice: -1 });
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    if (productArray && productArray.length === 0) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let wishProducts = await productModel.find({
          _id: { $in: productArray },
        });
        for (let i= 0; i < wishProducts.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: wishProducts[i].pImages[0],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          wishProducts[i].url = url
        }
        if (wishProducts) {
          return res.json({ Products: wishProducts });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    if (productArray.length === 0) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let cartProducts = await productModel.find({
          _id: { $in: productArray },
        });
        for (let i= 0; i < cartProducts.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: cartProducts[i].pImages[0],
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          cartProducts[i].url = url
        }
        if (cartProducts) {
          return res.json({ Products: cartProducts });
        }
      } catch (err) {
        return res.json({ error: "Cart product wrong" });
      }
    }
  }

  async postAddReview(req, res) {
    let { pId, rating, review } = req.body;
    const uId = req.userDetails._id;
    if (!pId || !rating || !review || !uId) {
      return res.json({ error: "All filled must be required" });
    } else {
      let checkReviewRatingExists = await productModel.findOne({ _id: pId });
      if (checkReviewRatingExists.pRatingsReviews.length > 0) {
        checkReviewRatingExists.pRatingsReviews.map((item) => {
          if (item.user === uId) {
            return res.json({ error: "Your already reviewd the product" });
          } else {
            try {
              let newRatingReview = productModel.findByIdAndUpdate(pId, {
                $push: {
                  pRatingsReviews: {
                    review: review,
                    user: uId,
                    rating: rating,
                  },
                },
              });
              newRatingReview.exec((err, result) => {
                if (err) {
                  console.log(err);
                }
                return res.json({ success: "Thanks for your review" });
              });
            } catch (err) {
              return res.json({ error: "Cart product wrong" });
            }
          }
        });
      } else {
        try {
          let newRatingReview = productModel.findByIdAndUpdate(pId, {
            $push: {
              pRatingsReviews: { review: review, user: uId, rating: rating },
            },
          });
          newRatingReview.exec((err, result) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Thanks for your review" });
          });
        } catch (err) {
          return res.json({ error: "Cart product wrong" });
        }
      }
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    if (!rId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let reviewDelete = productModel.findByIdAndUpdate(pId, {
          $pull: { pRatingsReviews: { _id: rId } },
        });
        reviewDelete.exec((err, result) => {
          if (err) {
            console.log(err);
          }
          return res.json({ success: "Your review is deleted" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
  
}



const productController = new Product();
module.exports = productController;

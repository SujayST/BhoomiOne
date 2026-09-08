const { toTitleCase } = require("../config/function");
const testimonialsModel = require("../models/testimonials");
const storeModel = require("../models/stores")
const fs = require("fs");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


class Testimonial{
  async getAllTestimonials(req, res) {
      try {
        let Testimonials = await testimonialsModel.find({}).sort({ _id: -1 });
        if (Testimonials) {
          for (let i= 0; i < Testimonials.length; i++){
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME,
              Key: Testimonials[i].tImage,
            }
            var command = new GetObjectCommand(getObjectParams);
            var url = await getSignedUrl(s3Client, command);
            Testimonials[i].url = url
          }
          
          return res.json({ Testimonials });
        }
      } catch (err) {
        console.log(err);
      }
    }

  async getStoreTestimonials(req, res) {
    const { storename } = req.body;
    try {
        const store = await storeModel.findOne({ sName: storename });
    
        if (!store) {
            return res.status(404).json({ error: "Store not found" });
        }
      let Testimonials = await testimonialsModel.find({ store: store._id }).sort({ _id: -1 });
      if (Testimonials) {
        for (let i= 0; i < Testimonials.length; i++){
          var getObjectParams ={
            Bucket: process.env.BUCKET_NAME,
            Key: Testimonials[i].tImage,
          }
          var command = new GetObjectCommand(getObjectParams);
          var url = await getSignedUrl(s3Client, command);
          Testimonials[i].url = url
        }
        return res.json({ Testimonials });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postAddTestimonial(req, res) {
    let { tName, tDescription, storeName } = req.body;
    let tImage = req.file.originalname
    console.log("data:",tName, storeName);

    if (!tName || !tDescription || !tImage || !storeName) {
        return res.json({ error: "All fields are required" });
    } else {
        tName = toTitleCase(tName);
        try {
          const store = await storeModel.findOne({ sName: storeName });
          if (!store) {
              return res.status(404).json({ error: "Store not found" });
          }

          let checkTestimonialExists = await testimonialsModel.findOne({ tName: tName });
          if (checkTestimonialExists) {
              return res.json({ error: "Testimonial from this person already exists" });
          } else {
              let randomTestName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
              var testName = randomTestName();

              let newTestimonial = new testimonialsModel({
                  tName,
                  tDescription,
                  tImage: testName,
                  store: store._id
              });
              await newTestimonial.save(async (err) => {
                console.log("adding the image to s3 for testimonial");
                if (!err){
                  let params = {
                    Bucket: 'peach13',
                    Key: testName,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                };
                try {
                    await s3Client.send(new PutObjectCommand(params));
                    console.log('File uploaded successfully');
                    return res.json({ success: "Testimonial posted successfully" });
                } catch (err) {
                    console.error(err);
                    return res.status(500).json({ error: "Failed to upload file to S3" });
                }
                }
              });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
  }

    async postEditTestimonial(req, res) {
        let { tId, tDescription } = req.body;
        if (!tId || !tDescription ) {
          return res.json({ error: "All filled must be required" });
        }
        try {
          let editTestimonial = testimonialsModel.findByIdAndUpdate(tId, {
            tDescription,
            updatedAt: Date.now(),
          });
          let edit = await editTestimonial.exec();
          if (edit) {
            return res.json({ success: "Testimonial edit successfully" });
          }
        } catch (err) {
          console.log(err);
        }
    }
    
    async getDeleteTestimonial(req, res) {
        let { tId } = req.body;
        if (!tId) {
            return res.json({ error: "All filled must be required" });
        } else {
            try {
                let deletedTestimonialFile = await testimonialsModel.findById(tId);
                const filePath = `../server/public/uploads/testimonials/${deletedTestimonialFile.tImage}`;

                let deleteTestimonial = await testimonialsModel.findByIdAndDelete(tId);
                if (deleteTestimonial) {
                    // Delete Image from uploads -> Testimonials folder 
                    fs.unlink(filePath, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    return res.json({ success: "Testimonial deleted successfully" });
                    });
                }
            } catch (err) {
            console.log(err);
            }
        }
    }
}

const testimonialsController = new Testimonial();
module.exports = testimonialsController;
const { toTitleCase } = require("../config/function");
const blogsModel = require("../models/blogs");

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sharp = require("sharp");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Blog{

    async deleteImage(file) {
        const params ={
          Bucket: 'peach13',
          Key: file,
        }
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
      }

    async getAllBlogs(req, res) {
        try {
          let Blogs = await blogsModel.find({}).sort({ _id: -1 });
          
          const blogPromises = Blogs.map(async (blog) => {
            var getObjectParams ={
              Bucket: process.env.BUCKET_NAME,
              Key: blog.bImage,
            }
            var command = new GetObjectCommand(getObjectParams);
            blog.url  = await getSignedUrl(s3Client, command);
            return blog; 
          });
          
          Blogs = await Promise.all(blogPromises); 
          
          if (Blogs) {
            return res.json({ Blogs });
          }
        } catch (err) {
          console.log(err);
        }
      }

    async postAddBlog(req, res) {
        let { bName, bDescription } = req.body;
        let bImage = req.file.originalname;

        let randomBlogName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
        let buffer= await sharp(req.file.buffer).toBuffer();

        var blogName = randomBlogName();

        if (!bName || !bDescription || !bImage) {  
            // console.log("60:", bName, bDescription, bImage);
            return res.json({ error: "All fields are required" });
        }else {
            bName = toTitleCase(bName);
            try {
                let checkBlogExists = await blogsModel.findOne({ bName: bName });
                if (checkBlogExists) {
                    return res.json({ error: "Blog with this title already exists" });
                }else {
                    let newBlog = new blogsModel({
                    bName,
                    bDescription,
                    bImage : blogName,
                    });
                    await newBlog.save(async(err) => {
                    if (!err) {
                          let params = {
                            Bucket: 'peach13',
                            Key: blogName,
                            Body: buffer,
                            ContentType: req.file.mimetype,
                          };
                          try {
                            await s3Client.send(new PutObjectCommand(params));
                            console.log('File uploaded successfully');
                          } catch (err) {
                            console.error(err);
                          }
                          return res.json({ success: "Blog posted successfully" });
                        }
                    });
                }
            }catch (err) {
                console.log(err);
            }
        }
    }

    async postEditBlog(req, res) {
        let { bId, bDescription } = req.body;
        if (!bId || !bDescription ) {
          return res.json({ error: "All fields are required" });
        }
        try {
          let editBlog = blogsModel.findByIdAndUpdate(bId, {
            bDescription,
            updatedAt: Date.now(),
          });
          let edit = await editBlog.exec();
          if (edit) {
            return res.json({ success: "Blog edit successfully" });
          }
        } catch (err) {
          console.log(err);
        }
    }
    
    async getDeleteBlog(req, res) {
        let { bId } = req.body;
        if (!bId) {
            return res.json({ error: "All fields are required" });
        } else {
            try {
                let deletedBlogFile = await blogsModel.findById(bId);
                const filePath = `../server/public/uploads/blogs/${deletedBlogFile.bImage}`;

                let deleteBlog = await blogsModel.findByIdAndDelete(bId);
                if (deleteBlog) {
                    // Delete Image from uploads -> Blogs folder 
                    const params ={
                        Bucket: 'peach13',
                        Key: deletedBlogFile.bImage,
                    }
                    const command = new DeleteObjectCommand(params);
                    await s3Client.send(command);
                    return res.json({ success: "Blog deleted successfully" });
                }
            } catch (err) {
            console.log(err);
            }
        }
    }
}

const blogsController = new Blog();
module.exports = blogsController;

const cartModel = require("../models/cart");
const mongoose = require("mongoose")

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require("crypto");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const productModel = require("../models/products");
const storeModel = require("../models/stores");
const sharp = require("sharp");

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

class Cart {
    async getCartItems(req, res) {
        let userId = req.userDetails._id;
        if (!userId) {
            return res.json({ error: "User needs to be logged in" });
        }
    
        try {
            let responseData = await cartModel.findOne({ userId })
                .populate("cartProducts.productId", "_id pImages pStore"); // Populate product info
    
            // Iterate through the cartProducts and generate signed URLs, also fetch store name
            for (let cartProduct of responseData.cartProducts) {
                let getObjectParams = {
                    Bucket: process.env.BUCKET_NAME,
                    Key: cartProduct.productId.pImages[0],
                };
                let command = new GetObjectCommand(getObjectParams);
                let url = await getSignedUrl(s3Client, command);
                cartProduct.url = url;
    
                // Fetch store name using the productStoreId
                const storeId = cartProduct.productStoreId;
                // Fetch store details from storeModel using storeId
                let store = await storeModel.findById(storeId);
                if (store) {
                    cartProduct.storeName = store.sName; // Add store name to cartProduct
                } else {
                    cartProduct.storeName = "Unknown Store"; // Default if store not found
                }
            }
    
            if (!responseData) {
                return res.json({ message: "No products found" });
            }
    
            return res.json(responseData); // Return the cart data with the store name included
    
        } catch (err) {
            console.error("Error fetching cart items:", err);
            return res.json({ error: "Error fetching cart items" });
        }
    }
    
    
    


    async addItemToCart(req, res) {
        const userId = req.userDetails._id;
        const { productId, productSize, productQuantity, productPrice, productStoreId, productPhotoUrl, productName } = req.body
        if (!userId) {
            return res.json({ error: "User needs to be logged in" });
        }
        try {
            const cartProducts = await cartModel.findOneAndUpdate(
                { userId },
                {
                    $push: {
                        cartProducts:
                        {
                            productId,
                            productSize,
                            productQuantity,
                            productPrice,
                            productStoreId,
                            productName
                        }

                    }
                },
                {
                    new: true,
                    upsert: true
                }
            )
            if (!cartProducts)
                return res.json({ "message": "there was a problem creating " })
            return res.json(cartProducts)
        } catch (err) {
            return res.json({ error: "heheheeh" })
        }

    }

    async removeItemFromCart(req, res) {
        const userId = req.userDetails._id;
        const { productId, productSize } = req.body

        if (!userId)
            return res.json({ error: "User must be logged in" })
        if (!productId || !productSize) {
            return res.json({ error: "Need productId" })
        }

        try {
            const cartProducts = await cartModel.findOneAndUpdate(
                { userId },
                {
                    $pull: {
                        cartProducts: {
                            productId: productId,
                            productSize:productSize
                        }
                    }
                },
                { new: true }

            )
            if (!cartProducts) {
                return res.json({ error: "Please add products" })
            }
            return res.json(cartProducts)
        } catch (err) {
            return res.json({ error: err })
        }
    }

    async removeAllProductsFromCart(req, res) {
        const userId = req.userDetails._id;

        if (!userId)
            return res.json({ error: "User must be logged in" })

        try {
            const clearedCart = await cartModel.findOneAndUpdate(
                { userId },
                { $set: { cartProducts: [] } }
            )
            if (clearedCart) {
                return res.json({ message: "Cart cleared successfully" })
            }
            return res.json({ error: "There was a problem clearing the cart" })
        } catch (err) {
            console.log(err)
            return res.json({ error: err })
        }
    }

    async changeProductQuantity(req, res) {
        const userId = req.userDetails._id;
        const { productId, productSize, productQuantity } = req.body

        if (!userId)
            return res.json({ error: "User must be logged in" })

        if (!productId || !productQuantity || !productSize)
            return res.json({ error: "All fields are required" })

        try {

            const cartProducts = await cartModel.findOneAndUpdate(
                { userId, 'cartProducts.productId': productId, 'cartProducts.productSize': productSize },
                { $set: { 'cartProducts.$.productQuantity': productQuantity } },
                { new: true, useFindAndModify: false }
            );

            if (!cartProducts)
                return res.json({ error: "error finding the product" })

            return res.json(cartProducts)

        } catch (err) {
            res.json({ error: err })
        }
    }

    async changeProductSize(req, res) {
        const userId = req.userDetails._id;
        const { productId, productSize } = req.body

        if (!userId)
            return res.json({ error: "User must be logged in" })

        if (!productId || !productSize)
            return res.json({ error: "All fields are required" })

        try {

            const productAlreadyExists = await cartModel.findOne(
                { userId, 'cartProducts.productId': productId, 'cartProducts.productSize': productSize }
            )
            if (productAlreadyExists)
                return res.json({ error: "Product with selected size already exists" })

            const cartProducts = await cartModel.findOneAndUpdate(
                { userId, 'cartProducts.productId': productId },
                { $set: { 'cartProducts.$.productSize': productSize } },
                { new: true, useFindAndModify: false }
            );

            if (!cartProducts)
                return res.json({ error: "error finding the product" })

            return res.json(cartProducts)

        } catch (err) {
            res.json({ error: err })
        }
    }


    //TODO add to wishlist

    async addToWishlist(req, res) {
        const userId = req.userDetails._id;
        const { productId } = req.body

        if (!userId)
            return res.json({ error: "User must be logged in" })

        if (!productId)
            return res.json({ error: "All fields are required" })

        try {
            const wishlistProducts = await cartModel.findOneAndUpdate(
                { userId },
                {
                    $push: {
                        wishlistProducts: {
                            productId
                        }
                    }
                },
                {
                    new: true,
                    upsert: true
                }

            )
            if (!wishlistProducts) {
                return res.json({ error: "Error adding to wishlist" })
            }
            return res.json(wishlistProducts);
        } catch (err) {
            return res.json({ error: err })
        }
    }
    //TODO remove from wishlist

    async removeFromWishlist(req, res) {
        const userId = req.userDetails._id;
        const { productId } = req.body

        if (!userId)
            return res.json({ error: "User must be logged in" })

        if (!productId)
            return res.json({ error: "All fields are required" })
        try {
            const wishlistProducts = await cartModel.findOneAndUpdate(
                { userId },
                {
                    $pull: {
                        wishlistProducts: {
                            productId
                        }
                    }
                },
                { new: true }
            )
            if (!wishlistProducts)
                return res.json({ error: "There was a problem deleting the product" })
            return res.json(wishlistProducts)
        } catch (err) {
            return res.json({ error: err })
        }
    }



}

const cartController = new Cart();
module.exports = cartController;
const express = require("express");
const router = express.Router();
const cartController = require("../controller/cart")
const {loginCheck} = require("../middleware/auth")

router.post("/add-product",loginCheck,cartController.addItemToCart)
router.post("/remove-cart-item",loginCheck,cartController.removeItemFromCart);
router.get("/remove-all-items",loginCheck,cartController.removeAllProductsFromCart);
router.post("/change-quantity",loginCheck,cartController.changeProductQuantity);
router.post("/change-size",loginCheck,cartController.changeProductSize);
router.get("/get-cart-items", loginCheck, cartController.getCartItems);

router.post("/add-wishlist",loginCheck,cartController.addToWishlist);
router.post("/remove-from-wishlist",loginCheck,cartController.removeFromWishlist);


module.exports = router;

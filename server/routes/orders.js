const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders");
const ShippingController = require("../controller/shippingServices")
const invoiceController = require("../controller/invoice")
const { loginCheck,isSuperAdmin,isAdmin } = require("../middleware/auth");

router.get("/get-all-orders", loginCheck, isSuperAdmin, ordersController.getAllOrders);
router.post("/get-all-orders", loginCheck, isSuperAdmin, ordersController.getAllOrders);
router.post("/get-store-orders", loginCheck, isAdmin, ordersController.getOrderByStore);
router.post("/order-by-user",loginCheck, ordersController.getOrderByUser);

router.post("/create-order",loginCheck, ordersController.postCreateOrder);
router.post("/update-order",loginCheck, ordersController.postUpdateOrder);
router.post("/delete-order", loginCheck,ordersController.postDeleteOrder);
router.post("/return-order",loginCheck, ordersController.postReturnOrder);
router.post("/create-shippment",loginCheck,isSuperAdmin, ordersController.postCreateShippment);
router.post("/track-order",loginCheck, ShippingController.trackOrder);
router.post("/get-invoice-link",loginCheck, invoiceController.getInvoiceLink);
router.post("/get-shipping-label",loginCheck,isSuperAdmin, ShippingController.generateShippingLabel);

module.exports = router;

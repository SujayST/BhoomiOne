const axios = require("axios");
const requests = require("request");
const crypto = require('crypto');
const storeModel = require("../models/stores");
const productModel = require("../models/products");
const orderModel = require("../models/orders");
const userModel = require("../models/users");
const ejs = require('ejs');
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');
const bwipjs = require('bwip-js'); // Import bwip-js

async function getLocationDetailsFromPincode(pincode) {
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        const district = data.PostOffice[0].District;
        const state = data.PostOffice[0].State;
        return { district, state };
      } else {
        throw new Error('No data found for the pincode');
      }
    } catch (error) {
      console.error('Error fetching location data:', error);
      throw error;
    }
  }
  class ShippingService {
    constructor() {
        this.generateShippingLabel = this.generateShippingLabel.bind(this);
        this.convertLabelToPdf = this.convertLabelToPdf.bind(this);
    }

    async trackOrder(req, res) {
        console.log("waybill", req.body.waybill);
        let { waybill } = req.body;
        try {
            const response = await axios.get(`${process.env.DELHIVERY_API_URL}/api/v1/packages/json/`, {
                params: { waybill: waybill.toString() },
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${process.env.DELHIVERY_API_KEY}`
                }
            });
            if (response.data) {
                return res.json(response.data);
            }
        } catch (error) {
            console.error("Error fetching tracking data:", error);
            throw error;
        }
    }

    async createShipping(orderDetails, userDetails) {
        try {
            const address = JSON.parse(orderDetails.address);
            const ref_num = `${orderDetails.transactionDetails[2]}_${crypto.randomInt(100, 1000)}`;

            const shipmentData = {
                shipments: [
                    {
                        add: address.address,
                        order: ref_num,
                        name: userDetails.fullname,
                        pin: address.pincode,
                        phone: orderDetails.phone.toString(),
                        address_type: "Home",
                        country: "IN",
                        payment_mode: "Pre-paid",
                        fragile_shipment: true,
                        total_amount: orderDetails.amount,
                        cod_amount: 0,
                        client: "B2CKEYTESTEXPRESS-B2C",
                    }
                ],
                pickup_location: { name: "B2CKEYTEST EXPRESS" }
            };

            const formattedData = `format=json&data=${JSON.stringify(shipmentData)}`;
            const response = await axios.post(`${process.env.DELHIVERY_API_URL}/api/cmu/create.json`, formattedData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    "Authorization": `Token ${process.env.DELHIVERY_API_KEY}`
                }
            });

            if ((response.data.packages.length !== 0) && (response.data.packages[0].status === "Success")) {
                let shippingDetails = {
                    waybill: response.data.packages[0].waybill,
                    upload_wbn: response.data.upload_wbn,
                    ref_num: ref_num
                };
                console.log("dfdafd",shippingDetails);
                return shippingDetails;
            } else {
                console.log("error", response.data);
                return { error: 'Failed to create shipping' };
            }
        } catch (error) {
            console.error('Error creating shipping:', error);
            return { error: 'Failed to create shipping' };
        }
    }

    async generateShippingLabel(req, res) {
        var { oId } = req.body;
        var orderData = await orderModel.findById(oId.toString());

        orderData.allProduct = orderData.allProduct[0];
        const shipping_address_details = JSON.parse(orderData.address);
        const orderId = orderData.transactionDetails[2].replace("order_", "");

        const product = await productModel.findById(orderData.allProduct[0].id.toString());
        const store = await storeModel.findById(product.pStore.toString());
        const userDetails = await userModel.findById(orderData.user.toString());
        const pincodeData = await getLocationDetailsFromPincode(store.sPincode);

        const orderDetails = {
            company_logo: 'https://example.com/company_logo.png',
            company_name: store.sName,
            company_address: store.sAddress,
            company_state: pincodeData.state,
            company_pincode: store.sPincode,
            shipping_name: userDetails.fullname,
            shipping_address: shipping_address_details.address,
            shipping_city: shipping_address_details.city,
            shipping_state: shipping_address_details.state,
            shipping_pincode: shipping_address_details.pincode,
            place_of_supply: shipping_address_details.state,
            place_of_delivery: shipping_address_details.city,
            invoice_number: orderData.invoiceKey.replace(/^invoices\//, ""),
            shippingDetails: orderData.shippingDetails,
            order_number: orderId,
            invoice_items: [
                {
                    description: product.pName,
                    quantity: orderData.allProduct.quantity,
                }
            ]
        };

        // Generate barcode using bwip-js
        const barcodeImage = await this.generateBarcode(orderDetails.shippingDetails.waybill);

        // Add barcode image to orderDetails
        orderDetails.barcodeImage = barcodeImage;

        // Generate PDF
        const pdfBuffer = await this.convertLabelToPdf(orderDetails);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${orderDetails.order_number}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    }

    async generateBarcode(waybill) {
        try {
            const barcodeBuffer = await bwipjs.toBuffer({
                bcid: 'code128',        // Barcode type
                text: waybill.toString(),          // Text to encode
                scale: 3,               // 3x scaling factor
                height: 10,             // Bar height, in millimeters
                includetext: true,      // Show human-readable text
                textxalign: 'center',   // Align text to center
            });
            return `data:image/png;base64,${barcodeBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Error generating barcode:', error);
            throw error;
        }
    }

    async convertLabelToPdf(orderDetails) {
        try {
            const invoiceTemplatePath = '../middleware/templates/shippingLabelTemplate.ejs';
            const htmlTemplatePath = path.resolve(__dirname, invoiceTemplatePath);
            const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');

            // Render HTML with orderDetails (including barcodeImage)
            const renderedHtml = ejs.render(htmlTemplate, orderDetails);
            const options = {
                width: '4in',
                height: '6in',
                orientation: 'portrait',
                border: {
                    top: '5mm',
                    right: '5mm',
                    bottom: '5mm',
                    left: '5mm'
                }
            };

            // Generate PDF from HTML
            const pdfBuffer = await new Promise((resolve, reject) => {
                pdf.create(renderedHtml, options).toBuffer((err, buffer) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
            });

            return pdfBuffer;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }
}

const shippingController = new ShippingService();
module.exports = shippingController;
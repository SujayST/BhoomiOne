const fs = require('fs');
// const PDFDocument = require('pdfkit');
const ejs = require('ejs');
const path = require('path');
const pdf = require('html-pdf');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const storeModel = require("../models/stores");
const productModel = require("../models/products")
const sharp = require('sharp'); // if not already installed, you can install it using npm install sharp
const axios =  require('axios');
const { log } = require('console');


const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

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

const gstCodes = {
  "01": "Jammu And Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman And Diu (old)",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman And Nicobar islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory"
}

class InvoiceSevice{

  async getInvoiceLink(req, res) {
    const {invoiceKey} = req.body;
    var getObjectParams ={
      Bucket: process.env.BUCKET_NAME,
      Key: invoiceKey,
    }
    var command = new GetObjectCommand(getObjectParams);
    var url = await getSignedUrl(s3Client, command);
    res.send(url);
  }

  async generateInvoice(orderData, userDetails){

    orderData.allProduct = orderData.allProduct[0]

    const shipping_address_details = JSON.parse(orderData.address)
    const orderId = orderData.transactionDetails[2].replace("order_", "");
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;  

    const product = await productModel.findById(orderData.allProduct[0].id);   
    const store = await storeModel.findById(product.pStore);
    const pincodeData = await getLocationDetailsFromPincode(store.sPincode);

    let getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: store.sSignature
    };
    let command = new GetObjectCommand(getObjectParams);
    let signUrl = await getSignedUrl(s3Client, command);

  
    const latestInvoiceNumber = store.sInvoceCount + 1
    const invoiceName = process.env.INVOICE_START + '_' + store.sName.substring(0, 2).toUpperCase() + '_' + latestInvoiceNumber.toString();

    const orderDetails = {
      company_logo: 'https://example.com/company_logo.png',
      company_name: store.sName,
      company_address: store.sAddress,
      company_state: pincodeData.state,
      company_pincode: store.sPincode,
      company_gst: store.GST.toUpperCase(),
      shipping_name: userDetails.name,
      shipping_address: shipping_address_details.address,
      shipping_city: shipping_address_details.city,
      shipping_state: shipping_address_details.state,
      shipping_pincode: shipping_address_details.pincode,
      place_of_supply: shipping_address_details.state,
      place_of_delivery: shipping_address_details.city,
      invoice_number: invoiceName,
      invoice_date: formattedDate,
      order_number: orderId,
      order_date: formattedDate,
      sign : signUrl,
      invoice_items: [
        {
          description: product.pName,
          unit_price: (orderData.allProduct[0].subtotal / orderData.allProduct[0].quantitiy),
          quantity: orderData.allProduct[0].quantitiy,
          net_amount: orderData.allProduct[0].subtotal,
          tax_rate: 12,
          tax_amount: orderData.allProduct[0].subtotal * (0.06),
          total_amount: orderData.allProduct[0].subtotal,
        },
      ],
      tax_total: orderData.allProduct[0].subtotal * (0.12),
      invoice_total: orderData.allProduct[0].subtotal,
    };

    const url = await this.convertInvoiceToPdf(orderDetails);

    store.sInvoceCount += 1;
    await store.save();
    console.log("line 142", url);
    return url;
    }

    async convertInvoiceToPdf(orderDetails) {
        try {
            // Read the HTML template 
            var invoiceTemplatePath = ''
            const stateName = gstCodes[orderDetails.company_gst.substring(0, 2)];

            if(stateName.toUpperCase() != orderDetails.shipping_state.toUpperCase()){
              invoiceTemplatePath =  '../middleware/templates/interStateInvoice.ejs'
            }
            else{
              invoiceTemplatePath =  '../middleware/templates/insideStateInvoice.ejs'
            }
            const htmlTemplatePath = path.resolve(__dirname, invoiceTemplatePath);
            const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');
          
            const renderedHtml = ejs.render(htmlTemplate, orderDetails);
            const options = {
                timeout: 60000 // Increase the timeout if your template is large
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
            
            const invoiceKey = `invoices/${orderDetails.invoice_number}_${orderDetails.order_number}.pdf`;

            const s3Params = {
              Bucket: process.env.BUCKET_NAME,
              Key: invoiceKey,
              Body: pdfBuffer,
            };
  
          const uploadCommand = new PutObjectCommand(s3Params);
          await s3Client.send(uploadCommand);

          return invoiceKey;

        } catch (error) {
            console.error('Error generating invoice:', error);
            throw error;
        }
    }
}

const invoice = new InvoiceSevice();
module.exports = invoice;


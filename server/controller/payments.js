const Razorpay = require("razorpay");
require("dotenv").config();
const crypto = require("crypto");

const instance = new Razorpay({ 
    key_id : process.env.RAZORPAY_API_KEY,
    key_secret : process.env.RAZORPAY_API_SECRET
})


exports.checkout = async (req, res) => {
    if (req.body.amount) {      
        const amount = parseInt(req.body.amount,10) * 100; // convert amount to paise
        const options = {
            amount: amount,
            currency: "INR",
        };

        try {
            const order = await instance.orders.create(options);
            res.status(200).json({
                success: true,
                order: order
            });
        } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    } else {
        res.status(400).send("Bad request: Amount is missing");
    }
};


exports.paymentVerification = async (req, res) => {

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Database comes here


    // await Payment.create({
    //   razorpay_order_id,
    //   razorpay_payment_id,
    //   razorpay_signature,
    // });

    // res.redirect(
    //   `${process.env.CLIENT_URL}paymentsuccessful?reference${razorpay_payment_id}`//make this page
    // );
    // res.status(200).json({
    //     payment : "payment successful"
    // })
  } else {
    res.status(400).json({
      success: false,
    });
  }
};

exports.getkey = async (req, res) => {

    res.status(200).json({
        key : process.env.RAZORPAY_API_KEY
    })
}

// module.exports = checkout;
// module.exports = paymentVerfication;



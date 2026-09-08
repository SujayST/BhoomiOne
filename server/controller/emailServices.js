const nodemailer = require('nodemailer');
require("dotenv").config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({

            host: process.env.SMTP_HOST,  // SMTP server hostname
            port: process.env.SMTP_PORT,  // SMTP server port (usually 465 for secure, 587 for TLS)
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL, // SMTP username
                pass: process.env.EMAILPASSWORD  // SMTP password
            }
        });
    }

    async sendEmailNotification(emailAddress, orderData ,productName) {
        const { address } = orderData;

        // Extract products and format them into a human-readable list
        const productList = orderData.allProduct.map(product => {
            return `${productName} - ${product.quantity}`;
        });

        // Construct the email message
        let mailOptions = {
            from: process.env.EMAIL, // Sender's email
            to: "support@thredit.in",
            subject: 'New Order Notification',
            text: `New order received!\n\nCustomer Address:\n${address}\n\nProducts:\n${productList.join('\n')}`
        };

        console.log("mailoptions", mailOptions);

        // Send the email
        try {
            let info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendResetPasswordLink(emailAddress, uniqueCode) {

        const msg = `Hi,
        This is your link to change password : 
        http://localhost:3000/resetPassword?token=${uniqueCode}`;

        

        let mailOptions = {
            from: process.env.EMAIL,
            to: emailAddress,
            subject: 'Reset Password Link',
            text: msg
        };
        // Send the email
        try {
            let info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    async sendEmailNotificationReturn(emailAddress, orderData ,productName) {
        const { address } = orderData;
        const emailAddresses = `${emailAddress}, ${process.env.RETURN_EMAIL}`;

        // Extract products and format them into a human-readable list
        const productList = orderData.allProduct.map(product => {
            return `${productName}`;
        });

        // Construct the email message
        let mailOptions = {
            from: process.env.EMAIL, // Sender's email
            to: emailAddresses,
            subject: 'Return Request created',
            text: `Return Request created!\n\nOrder Id\n${orderData.transactionDetails[2]}\n\nProduct:\n${productList.join('\n')}`
        };

        console.log("mailoptions", mailOptions);

        // Send the email
        try {
            let info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: ' + info.response);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}

const emailService = new EmailService();
module.exports = emailService;

const forgotPasswordModel = require("../models/forgotPassword");
const userModel = require("../models/users")
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const emailService = require("./emailServices")

function generateUniqueId(){
        // Generate a 36-character UUID
        const uniqueId = uuidv4();
      
        // Hash the UUID using SHA-256
        const hash = crypto.createHash('sha256').update(uniqueId).digest('hex');
        console.log(hash)
      
        return hash; // This will return a 64-character hexadecimal hash
      
}


const algorithm = 'aes-256-cbc';
const passphrase = 'your-strong-passphrase'; // Fixed passphrase
const salt = 'unique-salt-value'; // You can also use a fixed or random salt

// Generate a consistent key using PBKDF2
function generateKey() {
  // Key derivation with PBKDF2 (64,000 iterations, 32-byte key length for AES-256)
  return crypto.pbkdf2Sync(passphrase, salt, 64000, 32, 'sha256');
}

function encrypt(text) {
  const key = generateKey(); // Generate key from passphrase
  const iv = crypto.randomBytes(16); // Generate random IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Combine the IV and the encrypted text in Base64
  const ivAndEncrypted = iv.toString('base64') + ':' + encrypted;
  return encodeURIComponent(ivAndEncrypted);
}

function decrypt(encryptedText) {
  const key = generateKey(); // Generate key from passphrase
  // Split the encrypted text to extract the IV and the actual encrypted data
  const decodedText = decodeURIComponent(encryptedText);
  const [ivBase64, encryptedData] = decodedText.split(':');

  const iv = Buffer.from(ivBase64, 'base64'); // Convert IV back to a Buffer
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}



class ForgotPassword{

    async sendEmail(req,res){
        let {userEmail} = req.body;
        if(!userEmail)
            return res.status(404).json({error:"Please provide email"})
        try{
            const users = await userModel.findOne({email:userEmail}).exec();
            console.log(users)
            if(!users){
                return res.json({success:"Email sent"})
            }
        }catch(err){
            console.log(err);
        }
        const hash = generateUniqueId();
        try{
        const forgotPassword =  await new forgotPasswordModel({
            uniqueGeneratedId : hash,
            userEmail,
        }).save()
        if(forgotPassword){
            const base64EncodedHash = encrypt(hash);
            emailService.sendResetPasswordLink(userEmail,base64EncodedHash);
            res.json({success : "Email sent"})
        }
        }catch(err){
            console.log(err)
        }
    }

    async changePassword(req,res){
        const {uniqueId,userEmail,newPassword} = req.body;
        if(!uniqueId || !userEmail || !newPassword)
            return res.status(404).json({error : "No hacking please"});

        try{
            const decodedHash = decrypt(uniqueId);
            
            const checkIfTokenIsValid = await forgotPasswordModel.findOne(
                {
                    uniqueGeneratedId : decodedHash,
                    userEmail : userEmail
                }
            )
            if(checkIfTokenIsValid){
                const newPasswordHash = bcrypt.hashSync(newPassword, 10);
                let passChange = userModel.findOneAndUpdate({email:userEmail}, {
                    password: newPasswordHash,
                }).exec();
                if(passChange){
                    const result = await forgotPasswordModel.deleteOne({ uniqueGeneratedId: decodedHash });
                    return res.json({success : "Password updated successfully"})
                }
            }
            return res.status(403).json({error : "No hacking please"})
        }catch(err){
            console.log(err)
            return res.status(500).json({error:"Internal server error"})
        }

    }

    async checkIfTokenIsStillValid(req,res){
        const {uniqueId} = req.body;
        if(!uniqueId )
            return res.status(404).json({error : "No hacking please"});
        try{
            const decodedHash = decrypt(uniqueId)
            const checkIfTokenIsValid = await forgotPasswordModel.findOne({uniqueGeneratedId : decodedHash}).exec()
            if(checkIfTokenIsValid){
                return res.status(200).json({success : "Token is valid", userEmail: checkIfTokenIsValid.userEmail})
            }
            return res.status(403).json({error : "Token is invalid, please try after sometime"})
        }catch(err){
            console.log(err)
        }
    }
    

}

const forgotPasswordController = new ForgotPassword();
module.exports = forgotPasswordController;


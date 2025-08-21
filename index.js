const {initializeDatabase} = require('./db/db.connect')

initializeDatabase()

const express = require('express')
require('dotenv').config()

const PORT = process.env.PORT || 3000


const app = express()

const axios = require('axios')

const FormData = require('form-data')

app.use(express.json())

const multer = require('multer')

const fs = require('fs')

const uploadDir = ('./uploads')

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const Invoice = require('./model/Invoice.model')


//! query to save extracted data

async function saveExtractedData(newData){


    try {

        const extractedData = new Invoice(newData)

        const saveData = await extractedData.save()

       return saveData

 
    } catch (error) {
        
    }
}



app.post('/upload', upload.single("file"), async(req, res) => {

    const filePath = req.file.path

    const formData = new FormData();
formData.append("file", fs.createReadStream(filePath));

const { data } = await axios.post(
  "https://api.ocr.space/parse/image",
  formData,
  {
    headers: {
      apikey: process.env.OCR_API_KEY,
      ...formData.getHeaders(),
    },
  }
);


const text = data.ParsedResults?.[0]?.ParsedText || "";

const invoiceNum = text.match(/Invoice\s*#?\s*([A-Z0-9-]+)/i)?.[1] || "";
const date = text.match(/Date[:\s]+([\d\/-]+)/i)?.[1] || "";
const customerName = text.match(/Customer[:\s]+(.+)/i)?.[1]?.split("\n")[0] || "";
const totalAmount = parseInt(text.match(/Total[:\s]+([\d,.]+)/i)?.[1] || "");




const invoiceData = {

    fileName: req.file.filename,
    invoiceNumber: invoiceNum,
    date,
    customerName,
    totalAmount
}


const savedData = await saveExtractedData(invoiceData)

console.log(savedData)


res.json(savedData)


})



app.listen(PORT, () => {

    console.log(`Server is running on PORT ${PORT}`)

})



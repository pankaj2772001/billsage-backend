const { initializeDatabase } = require("./db/db.connect");

initializeDatabase();

const express = require("express");
require("dotenv").config();

const cors = require("cors");

const PORT = process.env.PORT || 3000;

const app = express();

const path = require("path");

const axios = require("axios");

const FormData = require("form-data");

app.use(express.json());

const corsOption = {
  origin: "*",
  allowedHeaders: ["Content-Type"],
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
};

app.use(cors(corsOption));

const multer = require("multer");

const fs = require("fs");

const uploadDir = "./uploads";

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const Invoice = require("./model/Invoice.model");

//! query to save extracted data

async function saveExtractedData(newData) {
  try {
    const extractedData = new Invoice(newData);

    const saveData = await extractedData.save();

    return saveData;
  } catch (error) {

    console.error("Error saving invoice data:", error.message);
    throw new Error("Failed to save invoice data");
  }
}

app.post("/upload", upload.single("document"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const filePath = path.resolve(req.file.path);

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
    const customerName =
      text.match(/Customer[:\s]+(.+)/i)?.[1]?.split("\n")[0] || "";
    const totalAmount = parseFloat(
      text.match(/Total[:\s]+([\d,.]+)/i)?.[1]?.replace(/,/g, "") || 0
    );

    const invoiceData = {
      fileName: req.file.filename,
      invoiceNumber: invoiceNum,
      date,
      customerName,
      totalAmount,
    };

    const savedData = await saveExtractedData(invoiceData);

    res.status(201).json(savedData);
  } catch (error) {
    console.error("OCR / DB error:", error.message);
    res.status(500).json({ error: "Failed to process invoice" });
  }
});

async function updateDataById(invoiceId, dataToUpdate) {
  try {
    const updatedData = await Invoice.findByIdAndUpdate(
      invoiceId,
      dataToUpdate,
      { new: true }
    );

    return updatedData;
  } catch (error) {
    console.error(`Error updating invoice with ID ${invoiceId}:`, error.message);
    throw new Error("Failed to update invoice data");
  }
}

app.post("/update/:invoiceId", async (req, res) => {
  try {
    const updatedData = await updateDataById(req.params.invoiceId, req.body);

    res.json(updatedData);
  } catch (error) {}
});

app.post("/summary/:invoiceId", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const invoiceNumber = invoice.invoiceNumber;
    const date = invoice.date;
    const customerName = invoice.customerName;
    const totalAmount = invoice.totalAmount;

    const prompt = `Please summarize the following invoice in one concise sentence:
Invoice Number: ${invoiceNumber}
Date: ${date}
Customer: ${customerName}
Total Amount: ${totalAmount}`;

    const response = await axios.post(
      "https://api.cohere.ai/v2/chat",
      {
        model: "command-a-03-2025",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that summarizes invoices in one sentence.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 50,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiSummary = response.data.message.content[0].text.trim();
    res.json({ aiSummary });
  } catch (error) {
    console.error("AI summary error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate AI summary" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({

    fileName: String,
    invoiceNumber: String,
    date: String,
    customerName: String,
    totalAmount: Number

}, {
    timestamps: true
})



const Invoice = mongoose.model("Invoice", invoiceSchema)

module.exports = Invoice
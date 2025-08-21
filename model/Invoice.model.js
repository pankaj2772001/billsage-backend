const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({

    fileName: String



})



const Invoice = mongoose.model('Invoice', invoiceSchema)

module.exports = Invoice
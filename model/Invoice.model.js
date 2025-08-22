const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({


    fileName: {

        type: String,
        required: true
    },

    invoiceNumber: {
        type: String,
        default: "UNKNOWN",
    },

    date: {

        type: String,
        default: "01/01/1970"
    },

    customerName: {
    type: String,
    default: "Not Provided"
  },

  totalAmount: {
    type: Number,
    default: 0
  }

}, {
    timestamps: true
})



const Invoice = mongoose.model("Invoice", invoiceSchema)

module.exports = Invoice
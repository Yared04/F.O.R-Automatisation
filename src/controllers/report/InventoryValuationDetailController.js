const prisma = require("../../database");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const {formatNumber} = require('./NumberFormatService')

async function generateInventoryValuation(req, res) {
  try {
    // find all products
    const {endDate} = req.query;
    const products = await prisma.product.findMany({});
    // find all inventory transactions
    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }
    let productFilter = {
      productId: {
        in: products.map((product) => product.id),
      },
    };
    if(endDate){
      productFilter.date = {
        lte: new Date(endDate),
      };
    }

    const productPurchaseTransactions = await prisma.productPurchase.findMany({
      where: productFilter,
      orderBy: {
        date: "asc",
      },
    });

    const inventoryTransactions = await prisma.inventory.findMany({
      where: {
        productId: {
          in: products.map((product) => product.id),
        },
      },
      include: {
        saleDetail: {
          select: {
            id: true,
            saleQuantity: true,
            saleUnitPrice: true,
            totalSales: true,
          },
        },
      },
    });
    if (inventoryTransactions.length === 0) {
      return res.status(404).json({ error: "No inventory transactions found" });
    }

    let saleDetailIds = [];
    inventoryTransactions.forEach((tr) => {
      if (tr.saleDetailId) {
        saleDetailIds.push(tr.saleDetailId);
      }
    });
    let caFilter = {};
    if(endDate){
      caFilter.date = {
        lte: new Date(endDate),
      };
    }
    const caTransactions = await prisma.CATransaction.findMany({
      where: {
        OR: [
          {
            saleDetailId: {
              in: saleDetailIds,
            },
          },
          {
            productPurchaseId: {
              in: productPurchaseTransactions.map((tr) => tr.id),
            },
          },
        ],
        AND:[caFilter]
      },
      orderBy: { date: "asc" },
      include: {
        chartofAccount: {
          select: {
            name: true,
          },
        },
        sale:{
          select:{
            invoiceDate:true,
          }
        },
        saleDetail: {
          select: {
            saleQuantity: true,
            saleUnitPrice: true,
            totalSales: true,
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer:{
          select:{
            firstName:true,
            lastName: true
          }
        },
        productPurchase: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            date:true,
            purchaseQuantity: true,
            remainingQuantity: true,
            purchaseUnitPriceETB: true,
            purchaseUnitPriceUSD: true,
            purchaseTotalETB: true,
          },
        },
        supplier:{
          select:{
            name:true,
          }
        }
      },
      orderBy: { date: "asc" },
    });

    caTransactions.sort((a, b) => {
      const dateA = a.sale?.invoiceDate || a.productPurchase?.date;
      const dateB = b.sale?.invoiceDate || b.productPurchase?.date;
    
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
      return 0;
    });

    // return accountType credit and debit detail
    const clusteredProducts = clusterByProduct(caTransactions, products);

    //return total credit and debit
    const totals = calculateTotal(clusteredProducts);

    // Generate PDF content
    const pdfContent = await generateInventoryValuationPdf(
      clusteredProducts,
      totals,
      endDate
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Inventory valuation.pdf"'
    );

    // Stream PDF content to the client
    const stream = new Readable();
    stream.push(pdfContent);
    stream.push(null); // Indicates the end of the stream
    stream.pipe(res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

function clusterByProduct(caTransactions, products) {
  let clusteredProducts = {};
  products.forEach((product) => {
    const test = caTransactions
    .filter((tr) => {
      return (
        tr.productPurchase?.product?.id === product.id ||
        tr.saleDetail?.product?.id === product.id
      );
    })
    .map((ca) => {
      const customerName = ca.customer?.firstName && ca.customer?.lastName ? `${ca.customer?.firstName} ${ca.customer?.lastName}` : undefined;
      const supplierName = ca.supplier?.name;
      const name = customerName ? customerName : supplierName;

      const key = {
        product: -ca.saleDetail?.saleQuantity || ca.productPurchase?.remainingQuantity,
        number: ca.number,
        date: formatDateUTCtoMMDDYYYY(ca.date),
        transactionType: ca.type,
        qty: -ca.saleDetail?.saleQuantity || ca.productPurchase?.purchaseQuantity,
        rate: ca.saleDetail?.saleUnitPrice || ca.productPurchase?.purchaseUnitPriceETB || 0.0,
        fifoCost: -ca.saleDetail?.totalSales || ca.productPurchase?.purchaseTotalETB || 0.0,
        qtyOnHand: ca.productPurchase?.remainingQuantity || 0.0,
        assetValue: -ca.saleDetail?.totalSales || ca.productPurchase?.purchaseTotalETB || 0.0,
      };

      return { key, name };
    });

    clusteredProducts[product.name] = Array.from(
      new Set(
        test.map(item=>item.key)
      )
    ).map((object) => {
      // Add the 'name' property back to the final object
      return { ...object, name: test.find((item) => item.key === object).name};
    });
  });
  return clusteredProducts;
}


function calculateTotal(products) {
  const totals = {};
  
  for (const productName in products) {
    const productTransactions = products[productName];
    let totalQty = 0;
    let totalFifoCost = 0;
    let totalQtyOnHand = 0;
    let totalAssetValue = 0;

    let prevAssetValue = 0;
    
    for (const transaction of productTransactions) {
      transaction.assetValue += prevAssetValue;
      prevAssetValue = transaction.assetValue;
      totalQty += transaction.qty || 0;
      totalFifoCost += transaction.fifoCost || 0;
      totalQtyOnHand += transaction.qtyOnHand || 0;
      totalAssetValue += transaction.assetValue || 0;
    }
    
    totals[productName] = {
      totalQty,
      totalFifoCost,
      totalQtyOnHand,
      totalAssetValue
    };
  }
  
  return totals;
}

async function generateInventoryValuationPdf(transactions, totals, endDate) {
  const handleTimeSpan = (endDate) => {
    if(endDate) return formatDateForTitle(endDate);
    return "All Dates";
  };
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    // Buffer PDF content
    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    let pageCount = 0;
    const columnTitles = [["DATE",10], ["TRANSACTION TYPE", 70], ["NO.", 180], ["NAME", 210], ["QTY", 300], ["RATE", 350],[ "FIFO COST", 400], ["QTY ON HAND", 470], ["ASSET VALUE",540]];

    const addHeaders = () => {
      ++pageCount;
      if (pageCount > 1) {
        doc.addPage();
      }
      xOffset = 10;
      yOffset = 190;
    doc
      .fontSize(10)
      .text("Inventory Valuation", { align: "center" })
      .moveDown();
    doc.fontSize(8).text(handleTimeSpan(endDate), { align: "center" }).moveDown();
      columnTitles.forEach((title) => {
        doc.text(title[0], title[1], 150,{
        });
      });
      doc.lineWidth(0.5); // Set line weight to 2 (adjust as needed)
      doc.moveTo(10, 145).lineTo(600, 145).stroke(); // Line above the first row
      doc.moveTo(10, 165).lineTo(600, 165).stroke(); // Line above the first row
      xOffset = 10;
    };


    doc.lineWidth(0.5); // Set line weight to 0.5 (adjust as needed)
    doc.moveTo(10, 120).lineTo(600, 120).stroke(); // Line above the first row

    let yOffset = 130;
    addHeaders();
    for (const productName in transactions) {
      if(yOffset > 680){
       addHeaders();
      }
      const productTransactions = transactions[productName].sort((a, b) => {
        const dateA = new Date( a.date); 
        const dateB = new Date (b.date);
      
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
      });
      doc.fontSize(9).text(productName, 10, yOffset,{
          bold: true,
      }).moveDown();
      yOffset += 30;
      doc.fontSize(8);
      doc.bold = false;
      productTransactions.forEach((transaction) => {
        if(yOffset + 20 > 680){
          addHeaders();
          }
        const { date, transactionType, number, product, name, rate, fifoCost, qtyOnHand, assetValue } = transaction;
        doc.text(date.toString(), columnTitles[0][1], yOffset);
        doc.text(transactionType, columnTitles[1][1], yOffset);
        doc.text(number??0, columnTitles[2][1], yOffset);
        doc.text(name, columnTitles[3][1], yOffset);
        doc.text(product??0,columnTitles[4][1], yOffset);
        doc.text(formatNumber(rate??0),columnTitles[5][1], yOffset);
        doc.text(formatNumber(fifoCost??0),columnTitles[6][1], yOffset);
        doc.text(formatNumber(qtyOnHand??0),columnTitles[7][1], yOffset);
        doc.text(formatNumber(assetValue??0),columnTitles[8][1], yOffset);
        yOffset += 20;
      });

      doc.moveTo(10, yOffset).lineTo(600, yOffset).stroke();
      yOffset+=10;
      //view the total of each product
      const total = totals[productName];
      doc.fontSize(8);
      doc.text("Total", 10, yOffset,{
        bold:true
      });
      doc.fontSize(8);
      doc.text(formatNumber(total.totalQty??0), columnTitles[4][1], yOffset);
      doc.text(formatNumber(total.totalFifoCost??0), columnTitles[6][1], yOffset);
      doc.text(formatNumber(total.totalQtyOnHand??0), columnTitles[7][1], yOffset);
      doc.text(formatNumber(productTransactions[productTransactions.length-1]?.assetValue??0), columnTitles[8][1], yOffset);
      yOffset += 20;
      doc.moveTo(10, yOffset).lineTo(600, yOffset).stroke(); // Line below the last row
      yOffset += 10;
    }
    doc.end();
  });
}

function formatDateUTCtoMMDDYYYY(utcDate) {
  const date = new Date(utcDate);
  const mm = date.getUTCMonth() + 1; // getMonth() is zero-based
  const dd = date.getUTCDate();
  const yyyy = date.getUTCFullYear();

  return `${mm.toString().padStart(2, "0")}/${dd
    .toString()
    .padStart(2, "0")}/${yyyy}`;
}

function formatDateForTitle(utcDate){
  const date = new Date(utcDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

module.exports = {
  generateInventoryValuation,
};

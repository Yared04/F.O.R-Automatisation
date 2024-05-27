const prisma = require("../../database");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

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
        productPurchase: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            purchaseQuantity: true,
            remainingQuantity: true,
            purchaseUnitPriceETB: true,
            purchaseUnitPriceUSD: true,
            purchaseTotalETB: true,
          },
        },
      },
    });

    // return accountType credit and debit detail
    const clusteredProducts = clusterByProduct(caTransactions, products);

    //return total credit and debit
    const totals = calculateTotal(clusteredProducts);

    // Generate PDF content
    const pdfContent = await generateInventoryValuationPdf(
      clusteredProducts,
      totals
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
    clusteredProducts[product.name] = Array.from(
      new Set(
        caTransactions
          .filter((tr) => {

            return (
              tr.productPurchase?.product?.id === product.id ||
              tr.saleDetail?.product?.id === product.id
            );
          })
          .map((ca) => {
            return JSON.stringify({
              product: product.name,
              number: ca.number,
              date: formatDateUTCtoMMDDYYYY(ca.date),
              transactionType: ca.type,
              qty:
                -ca.saleDetail?.saleQuantity ||
                ca.productPurchase?.purchaseQuantity,
              rate:
                ca.saleDetail?.saleUnitPrice ||
                ca.productPurchase?.purchaseUnitPriceETB ||
                0.0,
              fifoCost:
                -ca.saleDetail?.totalSales ||
                ca.productPurchase?.purchaseTotalETB ||
                0.0,
              qtyOnHand: ca.productPurchase?.remainingQuantity || 0.0,
              assetValue:  -ca.saleDetail?.totalSales || ca.productPurchase?.purchaseTotalETB || 0.0,
            });
          })
      )
    ).map((stringifiedObject) => JSON.parse(stringifiedObject));
}
  )
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

async function generateInventoryValuationPdf(transactions, totals) {
  const handleTimeSpan = () => {
    return "All Dates";
  };
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    // Buffer PDF content
    doc.on("data", (buffer) => buffers.push(buffer));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // add table headers
    doc.moveTo(0, 50);
    doc
      .fontSize(10)
      .text("Inventory Valuation", { align: "center" })
      .moveDown();
    doc.fontSize(8).text(handleTimeSpan(), { align: "center" }).moveDown();

    let pageCount = 0;
    const columnTitles = ["DATE", "TRANSACTION TYPE", "NO.", "NAME", "QTY", "RATE", "FIFO COST", "QTY ON HAND", "ASSET VALUE"];
    const columnOffsets = [10, 70, 180, 210, 300, 350, 400, 450,540];

    columnTitles.forEach((title, i) => {
      doc.text(title, columnOffsets[i], 110);
    });

    doc.lineWidth(0.5); // Set line weight to 0.5 (adjust as needed)
    doc.moveTo(10, 120).lineTo(600, 120).stroke(); // Line above the first row

    let yOffset = 130;
    for (const productName in transactions) {
      if(yOffset > 680){
        ++pageCount;
      if(pageCount > 1){
      doc.addPage();
      }
      xOffset = 10;
      yOffset = 190;
      }
      const productTransactions = transactions[productName];
      doc.fontSize(9).text(productName, 10, yOffset+5,{
          bold: true,
      }).moveDown();
      yOffset += 15;
      doc.fontSize(8)
      doc.bold = false;
      productTransactions.forEach((transaction) => {
        if(yOffset + 20 > 680){
            ++pageCount;
          if(pageCount > 1){
          doc.addPage();
          }
          xOffset = 10;
          yOffset = 190;
          }
        const { date, transactionType, number, name, qty, rate, fifoCost, qtyOnHand, assetValue } = transaction;
        doc.text(date.toString(), columnOffsets[0], yOffset + 10);
        doc.text(transactionType, columnOffsets[1], yOffset + 10);
        doc.text(number, columnOffsets[2], yOffset + 10);
        doc.text(name, columnOffsets[3], yOffset + 10);
        doc.text(qty.toString(),columnOffsets[4], yOffset + 10);
        doc.text(rate?.toFixed(2),columnOffsets[5], yOffset + 10);
        doc.text(fifoCost?.toFixed(2),columnOffsets[6], yOffset + 10);
        doc.text(qtyOnHand.toString(),columnOffsets[7], yOffset + 10);
        doc.text(assetValue?.toFixed(2),columnOffsets[8], yOffset + 10);
        yOffset += 30;
      });

      doc.moveTo(10, yOffset).lineTo(600, yOffset).stroke();
      //view the total of each product
      const total = totals[productName];
      doc.fontSize(8);
      doc.text("Total", 10, yOffset + 10,{
        bold:true
      });
      doc.fontSize(8);
      doc.text(total.totalQty?.toString(), columnOffsets[4], yOffset + 10);
      doc.text(total.totalFifoCost?.toFixed(2), columnOffsets[6], yOffset + 10);
      doc.text(total.totalQtyOnHand?.toString(), columnOffsets[7], yOffset + 10);
      doc.text(total.totalAssetValue?.toFixed(2), columnOffsets[8], yOffset + 10);
      yOffset += 30;
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

module.exports = {
  generateInventoryValuation,
};

const prisma = require("../../database");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const { formatNumber, formatFilterDate } = require("./ReportFormatServices");

async function generateInventoryValuation(req, res) {
  try {
    // find all products
    const { endDate } = req.query;
    const products = await prisma.product.findMany({});
    // find all inventory transactions
    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }
    productFilter = {};
    if (endDate) {
      productFilter.date = {
        lte: formatFilterDate(endDate),
      };
    }
    const inventoryTransactions = await prisma.inventory.findMany({
      include: {
        purchase:true,
        product: true,
        productPurchase: {
          include: {
            declaration: {
              select: {
                number: true,
              },
            },
          },
        },
        saleDetail: {
          include: {
            purchase: {
              select: {
                number: true,
              },
            },
            declaration: {
              select: {
                number: true,
              },
            },
          },
        },
        sale: {
          include: {
            customer: true,
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

    // return accountType credit and debit detail
    const clusteredProducts = clusterByProduct(inventoryTransactions, products);

    console.log(clusteredProducts);

    // Generate PDF content
    const pdfContent = await generateInventoryValuationPdf(
      clusteredProducts,
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

function clusterByProduct(invTransactions, products) {
  let clusteredProducts = {};
  products.forEach((product) => {
    let test = invTransactions.filter((tr) => tr.product?.id === product.id);
    test = test.map((ca) => {
      const declarationNumber =
        ca?.saleDetail?.declaration?.number ??
        ca?.productPurchase?.declaration?.number;
      const cogs =
        ca.saleDetail?.unitCostOfGoods ??
        ca.productPurchase?.purchaseUnitCostOfGoods;
      const balanceQuantity = ca.balanceQuantity;

      const productName = ca.product.name;
      const purchaseDate = ca.productPurchase?.date;
      let purchaseNumber = ca.purchase?.number;
      const purchaseQty = ca.productPurchase?.purchaseQuantity;
      const purchaseUnitPrice = ca.productPurchase?.purchaseUnitPriceETB;

      const saleNumber = ca.sale?.invoiceNumber;
      const saleUnitPrice = ca.saleDetail?.saleUnitPrice;
      const saleQty = ca.saleDetail?.saleQuantity;
      const invoiceDate = ca.sale?.invoiceDate;

      const key = {
        purchaseNumber: purchaseNumber,
        purchaseDate: purchaseDate,
        productName: productName,
        purchaseQty: purchaseQty,
        purchaseUnitPrice: purchaseUnitPrice,
        invoiceNumber: saleNumber,
        invoiceDate: invoiceDate,
        saleQty: saleQty,
        saleUnitPrice: saleUnitPrice,
        balanceQuantity: balanceQuantity,
        cogs: cogs,
        declarationNumber: declarationNumber
      };
      return { key, productName };
    });

    clusteredProducts[product.name] = Array.from(
      new Set(test.map((item) => item.key))
    ).map((object) => {
      // Add the 'name' property back to the final object
      return { ...object, productName: test.find((item) => item.key === object).productName };
    });
  });
  return clusteredProducts;
}

async function generateInventoryValuationPdf(transactions, endDate) {
  const handleTimeSpan = (endDate) => {
    if (endDate) return `As of ${formatDateForTitle(endDate)}`;
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
    const columnTitles = [
      ["purchase Number", 10],
      ["purchase Date", 50],
      ["product Name", 100],
      ["purchase Quantity", 160],
      ["purchase Unit Price", 200],
      ["Invoice Number", 240],
      ["Invoice Date", 280],
      ["Sale Quantity", 330],
      ["Sale Unit Price", 390],
      ["Balance Quantity", 440],
      ["COGS", 480],
      ["Declaration Number", 540],
    ];

    const textOptions = {lineBreak:true,width:50};

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
      doc
        .fontSize(8)
        .text(handleTimeSpan(endDate), { align: "center" })
        .moveDown();
      columnTitles.forEach((title) => {
        doc.text(title[0], title[1], 150, textOptions);
      });
      doc.lineWidth(0.5); // Set line weight to 2 (adjust as needed)
      doc.moveTo(10, 145).lineTo(600, 145).stroke(); // Line above the first row
      doc.moveTo(10, 170).lineTo(600, 170).stroke(); // Line above the first row
      xOffset = 10;
    };

    doc.lineWidth(0.5); // Set line weight to 0.5 (adjust as needed)
    let yOffset = 130;
    addHeaders();
    for (const productName in transactions) {
      if (yOffset > 660) {
        addHeaders();
      }
      const productTransactions = transactions[productName].sort((a, b) => {
        const dateA = new Date(a.purchaseDate??a.invoiceDate);
        const dateB = new Date(b.purchaseDate??b.invoiceDate);

        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        return 0;
      });
      doc
        .fontSize(9)
        .text(productName, 10, yOffset, {
          bold: true,
        })
        .moveDown();
      yOffset += 30;
      doc.fontSize(8);
      doc.bold = false;
      productTransactions.forEach((transaction) => {
        if (yOffset + 20 > 680) {
          addHeaders();
        }
        const {
        purchaseNumber,	purchaseDate, productName	,purchaseQty,	purchaseUnitPrice,	invoiceNumber,	invoiceDate,	saleQty,	saleUnitPrice,	balanceQuantity,cogs,	declarationNumber
        } = transaction;
        doc.text(purchaseNumber??"", columnTitles[0][1] , yOffset, {align:"left"});
        doc.text(formatDateUTCtoMMDDYYYY(purchaseDate), columnTitles[1][1] , yOffset,textOptions);
        doc.text(productName??"", columnTitles[2][1], yOffset,textOptions);
        doc.text(purchaseQty ?? "", columnTitles[3][1], yOffset,{align:"center", width:30});
        doc.text(formatNumber(purchaseUnitPrice), columnTitles[4][1], yOffset);
        doc.text(invoiceNumber??"", columnTitles[5][1], yOffset,{align:"center", width:30});
        doc.text(formatDateUTCtoMMDDYYYY(invoiceDate), columnTitles[6][1] , yOffset,textOptions);
        doc.text(saleQty??"", columnTitles[7][1], yOffset,{align:"center", width:30});
        doc.text(formatNumber(saleUnitPrice), columnTitles[8][1], yOffset);
        doc.text(balanceQuantity??"", columnTitles[9][1], yOffset,{align:"center", width:30});
        doc.text(formatNumber(cogs), columnTitles[10][1], yOffset);
        doc.text(declarationNumber??"", columnTitles[11][1], yOffset);
        yOffset += 30;
      });
      doc.moveTo(10, yOffset).lineTo(600, yOffset).stroke();
      yOffset += 3;
      doc.moveTo(10, yOffset).lineTo(600, yOffset).stroke(); // Line below the last row
      yOffset += 10;
    }
    doc.end();
  });
}

function formatDateUTCtoMMDDYYYY(utcDate) {
  if(!utcDate) return "";
  const date = new Date(utcDate);
  const mm = date.getUTCMonth() + 1; // getMonth() is zero-based
  const dd = date.getUTCDate();
  const yyyy = date.getUTCFullYear();

  return `${mm.toString().padStart(2, "0")}/${dd
    .toString()
    .padStart(2, "0")}/${yyyy}`;
}

function formatDateForTitle(utcDate) {
  const date = new Date(utcDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

module.exports = {
  generateInventoryValuation,
};

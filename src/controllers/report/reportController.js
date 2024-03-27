const PDFDocument = require('pdfkit');
const fs = require('fs');
const prisma = require("../../database");

async function generateCustomerAgingSummary(req, res) {
    try {
        const { endDate } = req.body; // Assuming the end date is passed in the request body

        // Use the provided end date or default to the current date
        const currentDate = endDate ? new Date(endDate) : new Date();

        // Find the Chart of Account for Accounts Receivable (A/R)
        const arChartOfAccount = await prisma.chartOfAccount.findFirst({
            where: {
                name: "Accounts Receivable (A/R)"
            }
        });

        if (!arChartOfAccount) {
            return res.status(404).json({ error: "Accounts Receivable (A/R) chart of account not found." });
        }

        // Find all transactions related to the Accounts Receivable (A/R) chart of account
        const arTransactions = await prisma.caTransaction.findMany({
            where: {
                chartofAccountId: arChartOfAccount.id,
                date: {
                    lte: currentDate // Filter transactions up to the end date
                }
            },
            include: {
                customer: true
            }
        });

        // Categorize transactions into aging buckets
        const agingBuckets = categorizeTransactions(arTransactions, currentDate);

        // Calculate credit amounts for each aging bucket
        const creditTotals = calculateCreditTotals(agingBuckets);

        // Calculate the overall total credit
        const totalCredit = Object.values(creditTotals).reduce((total, credit) => total + credit, 0);

        // Generate PDF report
        const pdfPath = await generatePDF(agingBuckets, creditTotals, totalCredit);
        
        res.json({ url: `/reports/${pdfPath}` });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
}

function categorizeTransactions(transactions, currentDate) {
    const agingBuckets = {
        current: [],
        days1to30: [],
        days31to60: [],
        days61to90: [],
        over90: []
    };

    transactions.forEach(transaction => {
        const daysDifference = Math.ceil((currentDate - new Date(transaction.date)) / (1000 * 60 * 60 * 24));
        if (daysDifference <= 30) {
            agingBuckets.current.push(transaction);
        } else if (daysDifference <= 60) {
            agingBuckets.days1to30.push(transaction);
        } else if (daysDifference <= 90) {
            agingBuckets.days31to60.push(transaction);
        } else if (daysDifference <= 90) {
            agingBuckets.days61to90.push(transaction);
        } else {
            agingBuckets.over90.push(transaction);
        }
    });

    return agingBuckets;
}

function calculateCreditTotals(agingBuckets) {
    const calculateTotalCredit = transactions => transactions.reduce((total, transaction) => total + (transaction.credit || 0), 0);

    const creditTotals = {
        current: calculateTotalCredit(agingBuckets.current),
        days1to30: calculateTotalCredit(agingBuckets.days1to30),
        days31to60: calculateTotalCredit(agingBuckets.days31to60),
        days61to90: calculateTotalCredit(agingBuckets.days61to90),
        over90: calculateTotalCredit(agingBuckets.over90)
    };

    return creditTotals;
}

async function generatePDF(agingBuckets, creditTotals, totalCredit) {
    const doc = new PDFDocument();
    const pdfPath = `customer-aging-summary-${Date.now()}.pdf`;
    const writeStream = fs.createWriteStream(`public/reports/${pdfPath}`);

    doc.pipe(writeStream);

    // Add report title and date
    doc.fontSize(20).text('A/R Ageing Summary', { align: 'center' }).moveDown();
    doc.fontSize(12).text(`As of ${new Date().toLocaleDateString()}`, { align: 'center' }).moveDown();

    // Add aging buckets data
    doc.fontSize(12).text('CURRENT:').text(creditTotals.current.toFixed(2)).moveDown();
    doc.fontSize(12).text('1 - 30 DAYS:').text(creditTotals.days1to30.toFixed(2)).moveDown();
    doc.fontSize(12).text('31 - 60 DAYS:').text(creditTotals.days31to60.toFixed(2)).moveDown();
    doc.fontSize(12).text('61 - 90 DAYS:').text(creditTotals.days61to90.toFixed(2)).moveDown();
    doc.fontSize(12).text('OVER 90 DAYS:').text(creditTotals.over90.toFixed(2)).moveDown();
    doc.fontSize(12).text('TOTAL:').text(totalCredit.toFixed(2)).moveDown();

    doc.end();
    return pdfPath;
}


module.exports ={ 
    generateCustomerAgingSummary
}

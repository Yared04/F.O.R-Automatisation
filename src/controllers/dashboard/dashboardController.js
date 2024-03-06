const prisma = require("../../database");

async function getExpenseDetails(req, res) {
      const { startDate, endDate } = req.query;
      const defaultStartDate = new Date();
      defaultStartDate.setFullYear(new Date().getFullYear(), 0, 1);
      defaultStartDate.setHours(0, 0, 0, 0);
      const effectiveStartDate = startDate || defaultStartDate.toISOString();
      const effectiveEndDate = endDate || new Date().toISOString();
      
      try {
        const expenses = await prisma.chartOfAccount.findMany({
          where: {
            accountType: {
              name: 'Expenses',
            },
          },
          include: {
            caTransactions: {
              where: {
                debit: { not: null },
                createdAt: {
                  gte: new Date(effectiveStartDate),
                  lte: new Date(effectiveEndDate),
                },
              },
            },
          },
        });
        
            const totalExpense = expenses.reduce((sum, expense) => {
              const expenseTotal = expense.caTransactions.reduce((transactionSum, transaction) => transactionSum + (transaction.debit || 0), 0);
              return sum + expenseTotal;
            }, 0);
        
            const detailExpenses = expenses.map(expense => {
              const expenseTotal = expense.caTransactions.reduce((transactionSum, transaction) => transactionSum + (transaction.debit || 0), 0);
              const percentage = (expenseTotal / totalExpense) * 100;
        
              return {
                name: expense.name,
                amount: expenseTotal,
                percentage: isNaN(percentage) ? 0 : percentage,
              };
            });
        
            const result = {
              totalExpense,
              detailExpenses,
            };
        
            res.json(result);
          } catch (error) {
            console.error('Error fetching expense details:', error);
          }
  }

async function getBankDetails(req, res) {
        try {
            const banks = await prisma.chartOfAccount.findMany({
              where: {
                accountType: {
                  name: 'Bank',
                },
              },
              include: {
                caTransactions: {
                  where: {
                    credit: { not: null },
                  },
                },
              },
            });
        
            const detailBanks = banks.map(bank => {
              const bankTotal = bank.caTransactions.reduce((transactionSum, transaction) => transactionSum + (transaction.credit || 0), 0);
        
              return {
                name: bank.name,
                amount: bankTotal,
              };
            });
        
            res.json(detailBanks);
          } catch (error) {
            console.error('Error fetching expense details:', error);
          }
  }

  module.exports = {
  getExpenseDetails,
  getBankDetails
}
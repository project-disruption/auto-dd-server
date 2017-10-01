const express = require('express')
const app = express()
const PORT = process.env.PORT || 3001
const moment = require('moment')

const xero = require('xero-node')
const fs = require('fs')
const path = require('path')
const config = require('../.credentials/xero-config.json')

if (config.privateKeyPath && !config.privateKey) {
  config.privateKey = fs.readFileSync(path.join(__dirname, '..', '.credentials', config.privateKeyPath))
}

const xeroClient = new xero.PrivateApplication(config)

app.get('/invoices', (req, res) => {
  xeroClient.core.invoices.getInvoices({
    where: 'Type=="ACCREC"',
    order: 'Date'
  })
    .then((invoices) => {
      invoices = invoices.sort((invoice1, invoice2) => {
        const date1 = moment(invoice1.Date)
        const date2 = moment(invoice2.Date)
        if(date1.isBefore(date2)) {
          return -1
        }
        if (date1.isAfter(date2)) {
          return 1
        }
        return 0
      })
      res.send(invoices)
    })
})


// In this block I'm trying to split out a P&L report by reporting line
app.get('/profitandlossbyline', (req, res) => {
  const fromDate = req.query.fromDate
  const toDate = req.query.toDate
  const line = req.query.line
  xeroClient.core.reports.generateReport({
    id: 'ProfitAndLoss',
    params: {
      fromDate, toDate
    }
  })
  .then(report) => {
    report === report.ReportID;
    console.log("User Name:",report.ReportID);
    res.send(report)
  }
})

function getReport(fromDate, toDate) {
  return xeroClient.core.reports.generateReport({
    id: 'ProfitAndLoss',
    params: {
      fromDate, toDate
    }
  })
}

function getField (report, field) {
  switch (field) {
    case 'sales':
      return Number(report.Rows.find((row) => row.Title === 'Income').Rows.find((row) => row.RowType === 'SummaryRow').Cells[1].Value)
    case 'Total Income':
      return report.Rows
    default:
      return null
  }
}



app.get('/profitandloss', (req, res) => {
  const fromDate = req.query.fromDate
  const toDate = req.query.toDate
  xeroClient.core.reports.generateReport({
    id: 'ProfitAndLoss',
    params: {
      fromDate, toDate
    }
  })
    .then((report) => {
      res.send(report)
    })
})



app.get('/joinprofitandloss', (req, res) => {
  const fromDate1 = '2016-01-01'
  const toDate1 = '2016-12-31'
  const fromDate2 = '2017-01-01'
  const toDate2 = '2017-12-31'

  Promise.all([
    getReport(fromDate1, toDate1),
    getReport(fromDate2, toDate2)
  ])
    .then((reports) => {
      res.send(reports)
    // const totalSales = getField(reports[0], 'sales') + getField(reports[1], 'sales')
    //  res.json({ totalSales })
    })

})

app.get('/accounts', (req, res) => {
  xeroClient.core.accounts.getAccounts({
    params: {
      Where: 'Type=="BANK"'
    }
  })
  .then(result => res.json(result))
})

app.listen(PORT, () => {
  console.log(`Now listening on port ${PORT}`)
})

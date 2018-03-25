const express = require('express')
const app = express()
const PORT = process.env.PORT || 3001
const moment = require('moment')
const _ = require('lodash')
const {getInvoices, getReport, getAccounts, types} = require('./xero')

app.get('/invoices', (req, res) => {
  getInvoices(`Type=="${types.accountsReceivable}"`, 'Date').then(invoices => {
    invoices = invoices.sort((invoice1, invoice2) => moment(invoice1.Date).diff(invoice2.Date))
    res.send(invoices)
  })
})

// Split out P&L by reporting line
app.get('/profitandlossbyline', (req, res) => {
  const fromDate = moment(req.query.fromDate)
  const toDate = moment(req.query.toDate)
  let promises = []
  if (!req.query.fromDate || !req.query.toDate || !fromDate.isValid() || !toDate.isValid()) {
    return res.status(400).json({error: true, message: 'invalid dates'})
  }
  while (fromDate.isBefore(toDate)) {
    promises.push(
      getReport(
        'ProfitAndLoss',
        moment(toDate)
          .subtract(1, 'months')
          .endOf('month')
          .format('YYYY-MM-DD'),
        moment(toDate)
          .endOf('month')
          .format('YYYY-MM-DD')
      )
    )
    toDate.subtract(1, 'months').format('YYYY-MM-DD')
    console.log('Retrieving Report', moment(toDate).format('YYYY-MM-DD'))
  }
  Promise.all(promises).then(reports => {
    console.log('Number of reports:', reports.length)
    const data = reports
      .map(report => {
        const rows = processRows(report.Rows)
        return {
          date: String(report.Rows.find(row => row.RowType === 'Header').Cells[1].Value),
          rows: rows
        }
      })
      .sort((reportA, reportB) => moment(reportA.date).diff(moment(reportB.date)))
    res.send(data)
  })
})

function processRows (rows) {
  return _.flatten(
    rows.map(row => {
      if (row.Cells) {
        const values = row.Cells.map(cell => {
          return cell.Value
        })
        if (values.length > 0) {
          const value = Number(values[1])
          return values[0].length > 0
            ? {
              line: values[0],
              value: isNaN(value) ? values[1] : value
            }
            : null
        }
      }
      if (row.Rows) {
        return processRows(row.Rows)
      }
    })
  ).filter(row => row)
}

app.get('/profitandloss', (req, res) => {
  const fromDate = req.query.fromDate
  const toDate = req.query.toDate
  getReport('ProfitAndLoss', fromDate, toDate).then(report => {
    res.send(report)
  })
})

app.get('/accounts', (req, res) => {
  getAccounts('BANK').then(result => res.json(result))
})

app.listen(PORT, () => {
  console.log(`Now listening on port ${PORT}`)
})

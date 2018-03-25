const xero = require('xero-node')
const fs = require('fs')
const path = require('path')
const config = require('../.credentials/xero-config.json')

if (config.privateKeyPath && !config.privateKey) {
  config.privateKey = fs.readFileSync(
    path.join(__dirname, '..', '.credentials', config.privateKeyPath)
  )
}

const xeroClient = new xero.PrivateApplication(config)

module.exports = {
  getInvoices: (where, order) => {
    return xeroClient.core.invoices.getInvoices({where, order})
  },
  getReport: (id, fromDate, toDate) => {
    return xeroClient.core.reports.generateReport({
      id: id,
      params: {
        fromDate,
        toDate
      }
    })
  },
  getAccounts: where => {
    return xeroClient.core.accounts.getAccounts({
      params: {
        Where: where
      }
    })
  },
  types: {
    accountsReceivable: 'ACCREC',
    bank: 'BANK'
  }
}

const {sortByDate} = require('../server/server')
const moment = require('moment')

test('sortByDate returns empty array', () => {
  const dates = []
  const actual = sortByDate(dates)
  const expected = []
  expect(actual).toEqual(expected)
})
test('sortByDate returns two sorted dates', () => {
  const today = moment()
  const yesterday = moment().subtract(1, 'd')
  const actual = sortByDate([today, yesterday])
  const expected = [yesterday, today]
  expect(actual).toEqual(expected)
})
test('sortByDate returns two sorted dates in an object', () => {
  const today = {Date: moment()}
  const yesterday = {Date: moment().subtract(1, 'd')}
  const actual = sortByDate([today, yesterday], d => d.Date)
  const expected = [yesterday, today]
  expect(actual).toEqual(expected)
})

var fs = require('fs')
var lz = require('lz')
var ni = require('./ni')
var path = require('path')

var RX1 = /-test\.js$/
var RX2 = /\.js$/

module.exports = function (args) {
  var dirname = process.env.PWD
  var DIR = args.length ? args : fs.readdirSync(dirname)

  // Add dependencies
  var dependencies = {}
  var dependenciesPath = path.join(dirname, 'dependencies.js')
  if (fs.existsSync(dependenciesPath)) {
    dependencies = require(dependenciesPath)
  }
  Object.keys(dependencies).forEach(function (dependency) {
    ni.register(dependency, dependencies[dependency])
  })


  // Run all tests
  var total = new lz(DIR)
    // XXX concatMap if it's a directory
    .map(function (file) {
      if (!RX2.test(file)) {
        return file + '-test.js'
      }

      return file
    })
    .filter(function (file) {
      return RX1.test(file) && fs.existsSync(path.join(dirname, file))
    })
    .map(function (file) {
      var test = ni.test(
        file.replace(RX1, ''),
        require(path.join(dirname, file))
      )

      // XXX pretty print
      console.log(test.name)
      console.log('    ' + test.passed + ' Passed')
      console.log('    ' + test.failed + ' Failed')
      console.log('    ' + test.time + 'ms')
      console.log()

      return test
    })
    .foldl(function (a, b) {
      return {
        time: a.time + b.time,
        passed: a.passed + b.passed,
        failed: a.failed + b.failed
      }
    })


  if (total) {
    console.log('Total')
    console.log('    ' + total.passed + ' Passed')
    console.log('    ' + total.failed + ' Failed')
    console.log('    ' + total.time + 'ms')
  } else {
    console.log('No tests found')
  }


  //console.log(_[color]('\nDone!'), i, 'Tests', f && f + ' Failed')
}

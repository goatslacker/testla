var assert = require('assert')
var EventEmitter = require('events').EventEmitter
var getParameterNames = require('getParameterNames')

var PASSED = 1
var FAILED = 2
var SKIPPED = 3

var REGISTERS = {
  assert: assert
}


function inject(params) {
  return params.map(function (param) {
    if (param in REGISTERS) {
      return REGISTERS[param]
    }

    throw new ReferenceError(
      '`' + param + '` was defined but ' +
      'not registered with ni'
    )
  })
}


var ni = Object.create(EventEmitter.prototype)

ni.INCOMPLETE = {}

ni.register = function (name, fn) {
  REGISTERS[name] = fn
}

// TODO async?
ni.test = function (name, tests) {
  return [{ passed: 0, failed: 0, skipped: 0, time: Date.now() }]
    .concat(
      Object.keys(tests)
        .map(function (test) {
          var fn = tests[test]
          var dependencies = inject(getParameterNames(fn))
          var result = null

          try {
            result = fn.apply(fn, dependencies)
          } catch (e) {
            result = e
          }

          var status = result instanceof Error
            ? FAILED
            : result === ni.INCOMPLETE ? SKIPPED : PASSED

          var test = {
            name: name,
            time: Date.now(),
            status: status,
            result: result
          }

          ni.emit('testCompleted', test)

          return test
        })
    )
    .reduce(function (a, b) {
      // XXX eww
      var passed = a.passed
      var failed = a.failed
      var skipped = a.skipped
      switch (b.status) {
        case PASSED:
          passed++
          break
        case FAILED:
          failed++
          break
        case SKIPPED:
          skipped++
          break
      }

      return {
        name: name,
        time: b.time - a.time,
        passed: passed,
        failed: failed,
        skipped: skipped,
        tests: tests
      }
    })
}

module.exports = ni

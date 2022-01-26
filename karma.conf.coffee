# an example karma.conf.coffee
module.exports = (config) ->
  config.set
    autoWatch: true
    frameworks: ['jasmine']
    browsers: ['Chromium', 'Firefox']
    preprocessors: {
      '**/*.coffee': ['coffee'],
    }
    coffeePreprocessor: {
      options: {
        bare: true,
        sourceMap: false
      }
      transformPath: (path) -> path.replace(/\.js$/, '.coffee')
    }
    files: [
      'node_modules/angular/angular.js'
      'node_modules/angular-mocks/angular-mocks.js'
      'node_modules/jquery/dist/jquery.js'
      'vendor/browserTrigger.js'
      {
        pattern: 'src/*.coffee'
        type: 'js'
      }
      {
        pattern: 'spec/*.coffee'
        type: 'js'
      }
    ]

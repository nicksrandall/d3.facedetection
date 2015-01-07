'use strict';

module.exports = function(grunt) {
  // measures the time each task takes
  require('time-grunt')(grunt);
  // load grunt config
  require('load-grunt-config')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['src/start.js', 'src/cascade.js', 'src/ccv.js', 'src/d3.facedetection.js', 'src/end.js'],
        dest: 'dist/d3.facedetection.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      files: ['Gruntfile.js', 'src/d3.facedetection.js', 'test/**/*.js'],
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    },
    release: {
      options: {
        bump: true,
        changelog: true,
        additionalFiles: ['bower.json']
      }
    }
  });

  grunt.registerTask('test', ['jshint', 'qunit']);

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);

};

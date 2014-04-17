module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    distFolder: 'dist',
    srcFolder: 'src',
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> Copyright (c) 2013 International Business Machines & OpenSocial Foundation, Apache Software License v2.0 */\n'
      },
      build: {
        src: '<%= distFolder %>/<%= pkg.name %>.js',
        dest: '<%= distFolder %>/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          window: true,
          navigator: true,
          console: true
        }
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['<%= srcFolder %>/*.js'],
        dest: '<%= distFolder %>/<%= pkg.name %>.js'
      }
    },
    jsdoc : {
      dist : {
        src: ['src/*.js'], 
        options: {
          destination: 'doc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-jsdoc');

  // Default task(s).
  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('default', ['jshint','concat','uglify','jsdoc']);

};
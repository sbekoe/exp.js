/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' <%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },

    replace: {
      dist: {
        options: {
          variables: {
            version: '<%= pkg.version %>',
            Exp:'<%= grunt.file.read("src/exp.core.js") %>',
            Match:'<%= grunt.file.read("src/match.core.js") %>',
            Collection:'<%= grunt.file.read("src/collection.core.js") %>'
          }
        },
        files: {
          './': [ 'exp.*' ],
        }
      }
    },

    qunit: {
      dist: ['test/**/*.html']
    },

    concat: {
      options:{
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        ' <%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
      },
      dist:{
        src: ['src/<%= pkg.name %>.js'],
        dest: '<%= pkg.name %>.js'
      }
    },

    // TODO: verify watch
    watch: {
      files: 'exp.js',
      tasks: 'jshint:dist qunit'
    },
    
    jshint: {
      options: {
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        strict: false,

        loopfunc: true,
        expr: true,
        evil: true,

        globals: {
          define: true,
          require: true,
          module: true,
          exports: true
        }
      },

      // jshint pkg file
      dist: ['<% pkg.name %>.js'],

      // jshint src files
      src:{
        files: {
          src:['src/*.core.js']
        },
        options: {
          globals: {
            "_": true,
            "Match": true,
            "Exp": true,
            "Collection": true,

            "SKIP": true,
            "BREAK": true,
            "MARKER": true,
            "SPLITTER": true,
            "PATH_DELIMITER": true,
            "CAPTURE_PREFIX": true,
            "INJECTION_PREFIX": true,
            "ASSIGNMENT_EXP": true,
            "REPETITION_EXP": true,
            "PARENTHESIS": true,
            "DEBUG_MODE": true,

            "esc": true,
            "resolvePath": true

          }
        }

      }

     
    },

    uglify: {
      options:{
        report:'min'
      },
      dist: {
        files: {
          'exp.min.js': ['exp.js']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint:src', 'concat', 'replace', 'jshint:dist', 'qunit', 'uglify:dist']);
  grunt.registerTask('travis',  ['jshint:dist', 'qunit:dist']);

};

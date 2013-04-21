/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

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
          // './src':['*.container.js']
        }
      }
    },

    lint: {
      // files: ['src/**/*.core.js']
      files: ['exp.js']
//      directives: {
//        scope:false
//      }
    },

    qunit: {
      files: ['test/**/*.html']
    },

    concat: {
      // dist: {
      //   src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>'],
      //   dest: '<%= pkg.name %>.js'
      // },
      build:{
        src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>'],
        dest: '<%= pkg.name %>.js'
      }
    },

    min: {
      // dist: {
      //   src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
      //   dest: '<%= pkg.name %>.min.js'
      // }
      build: {
        src: ['<banner:meta.banner>', '<config:concat.build.dest>'],
        dest: '<%= pkg.name %>.min.js'
      }
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
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
        evil: true
      },
      
      globals: {
        define: true,
        require: true,
        module: true,
        exports: true
      }
    },
    uglify: {}
  });
  grunt.loadNpmTasks('grunt-replace');
  // Default task.
  // grunt.registerTask('default', 'lint qunlint qunit it concat min replace');
  grunt.registerTask('default', 'concat replace lint qunit min');
  grunt.registerTask('travis', 'lint qunit');

};

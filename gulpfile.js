'use strict';

var gulp        = require('gulp'),
    $$          = require('gulp-load-plugins')();

var runSequence = require('run-sequence'),
    browserSync = require('browser-sync').create(),
    exec        = require('child_process').exec,
    path        = require('path'),
    escapeStr   = require('js-string-escape'),
    CleanCss    = require("clean-css");

var name     = 'tabz',
    global   = name,
    srcDir   = './src/',
    testDir  = './test/',
    buildDir = './build/';

//  //  //  //  //  //  //  //  //  //  //  //

gulp.task('lint', lint);
gulp.task('test', test);
gulp.task('browserify', function(callback) {
    browserify();
    browserifyMin();
    callback();
});
gulp.task('serve', browserSyncLaunchServer);

gulp.task('build', function(callback) {
    clearBashScreen();
    runSequence(
        'lint',
        'test',
        'inject-css',
        'browserify',
        callback);
});

gulp.task('watch', function () {
    gulp.watch([
        buildDir + '**',
        testDir + '**'
    ], ['build'])
        .on('change', function(event) {
            browserSync.reload();
        });
});

gulp.task('default', ['build', 'watch'], browserSyncLaunchServer);

gulp.task('inject-css', function () {
    var target = gulp.src(srcDir + name + '.js'),
        source = gulp.src(srcDir + name + '.css'),
        destination = gulp.dest(srcDir);

    target
        .pipe($$.inject(source, {
            transform: cssToJsFn,
            starttag: '/* {{name}}:{{ext}} */',
            endtag: '/* endinject */'
        }))
        .pipe($$.rename('index.js'))
        .pipe(destination);
});

//  //  //  //  //  //  //  //  //  //  //  //

function cssToJsFn(filePath, file) {
    var STYLE_HEADER = 'css = \'',
        STYLE_FOOTER = '\';';

    var css = new CleanCss({})
        .minify(file.contents.toString())
        .styles;

    file.contents = new Buffer(STYLE_HEADER + escapeStr(css) + STYLE_FOOTER);

    return file.contents.toString('utf8');
}

function lint() {
    return gulp.src(srcDir + name + '.js')
        .pipe($$.eslint())
        .pipe($$.eslint.format())
        .pipe($$.eslint.failAfterError());
}

function test(cb) {
    return gulp.src(testDir + 'index.js')
        .pipe($$.mocha({reporter: 'spec'}));
}

function browserify() {
    return gulp.src(srcDir + 'index.js')
        .pipe($$.replace(
            'module.exports =',
            'window.' + global + ' ='
        ))
        .pipe($$.browserify({  debug: true }))
        .on('error', $$.util.log)
        .pipe($$.rename(name + '.js'))
        .pipe(gulp.dest(buildDir));
}

function browserifyMin() {
    return gulp.src(srcDir + 'index.js')
        .pipe($$.replace(
            'module.exports =',
            'window.' + global + ' ='
        ))
        .pipe($$.browserify())
        .pipe($$.uglify())
        .on('error', $$.util.log)
        .pipe($$.rename(name + '.min.js'))
        .pipe(gulp.dest(buildDir));
}

function browserSyncLaunchServer() {
    browserSync.init({
        server: {
            // Serve up our build folder
            baseDir: buildDir,
            index: "demo.html"
        },
        port: 5009
    });
}

function clearBashScreen() {
    var ESC = '\x1B';
    console.log(ESC + 'c'); // (VT-100 escape sequence)
}

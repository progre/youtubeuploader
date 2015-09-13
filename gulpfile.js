'use strict';
let gulp = require('gulp');
let del = require('del');
let runSequence = require('run-sequence');

require('./gulp/copy')();
require('./gulp/jade')();
require('./gulp/stylus')();
require('./gulp/test')();
require('./gulp/ts')();

gulp.task('default', ['build-and-test', 'watch']);

gulp.task('build-and-test', ['build'], function (callback) {
    runSequence('test', callback);
});

gulp.task('build', ['clean'], function (callback) {
    runSequence('copy', 'jade', 'stylus', 'ts', callback);
});

gulp.task('clean', function () {
    return del('lib/');
});

gulp.task('copy', function (callback) {
    runSequence('copy:copy', callback);
});

gulp.task('jade', function (callback) {
    runSequence('jade:build', callback);
});

gulp.task('stylus', function (callback) {
    runSequence('stylus:build', callback);
});

gulp.task('ts', function (callback) {
    runSequence('ts:build', 'test', callback);
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['copy']);
    gulp.watch(['src/**/*.ts', '!src/test/'], ['ts']);
    gulp.watch('src/**/*.jade', ['jade']);
    gulp.watch('src/**/*.stylus', ['stylus']);
    gulp.watch('src/test/**/*.ts', ['test']);
});

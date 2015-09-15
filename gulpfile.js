'use strict';
let gulp = require('gulp');
let del = require('del');
let runSequence = require('run-sequence');

require('./gulp/copy')();
require('./gulp/jade')();
require('./gulp/stylus')();
require('./gulp/test')();
require('./gulp/ts')();

gulp.task('default', ['build', 'watch']);

gulp.task('release-build-and-test', ['release-build'], function (callback) {
    runSequence('test', callback);
});

gulp.task('build', ['clean'], function (callback) {
    runSequence('copy:copy', 'jade:build', 'stylus:build', 'ts', callback);
});

gulp.task('release-build', ['clean'], function (callback) {
    runSequence('copy:copy', 'jade:release', 'stylus:release', 'ts:release', callback);
});

gulp.task('clean', function () {
    return del('lib/');
});

gulp.task('ts', function (callback) {
    runSequence('ts:build', 'test', callback);
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['copy']);
    gulp.watch(['src/**/*.ts', '!src/test/'], ['ts']);
    gulp.watch('src/**/*.jade', ['jade:build']);
    gulp.watch('src/**/*.stylus', ['stylus:build']);
    gulp.watch('src/test/**/*.ts', ['test']);
});

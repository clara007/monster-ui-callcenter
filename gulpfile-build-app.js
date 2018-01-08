// Monster UI App Builder
// 1. npm install gulp && npm install gulp-sass && npm install gulp-clean
// 2. gulp --gulpfile gulpfile-build-app.js

'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var clean = require('gulp-clean');

gulp.task('default', ['copy-files'], function() {});

gulp.task('copy-files', ['sass'], function() {
	return gulp.src([
		'!src/**/*.{sass,scss}',
		'src/**/*'
	]).pipe(gulp.dest('dist'));
});

gulp.task('sass', ['clean-dist'], function(){
	return gulp.src('src/**/*.{sass,scss}')
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest('dist'))
});

gulp.task('clean-dist', function() {
	return gulp.src('dist', {read: false})
		.pipe(clean());
});
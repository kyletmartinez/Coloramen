const eslint = require("gulp-eslint");
const gulp = require("gulp");

gulp.task("lint-js", () => {
    return gulp.src(["../source/js/coloramen.js"])
        .pipe(eslint({configFile: ".eslintrc_js.json"}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("lint-jsx", () => {
    return gulp.src(["../source/jsx/coloramen.jsx"])
        .pipe(eslint({configFile: ".eslintrc_jsx.json"}))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task("default", gulp.series("lint-jsx", "lint-js"));

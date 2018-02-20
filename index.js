const ccAngular = require("conventional-changelog-angular");

module.exports = ccAngular.then((options) => {
    options.parserOpts.headerPattern = /^(:\w*:)?\s*(\w*)(?:\((.*)\))?\: (.*)$/;
    options.parserOpts.headerCorrespondence = [
        "emoji",
        "type",
        "scope",
        "subject"
    ];

    return options;
});

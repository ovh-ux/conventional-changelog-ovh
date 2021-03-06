"use strict";

const { readFileSync } = require("fs");
const path = require("path");
const gufg = require("github-url-from-git");
const Moniker = require("moniker");
const names = Moniker.generator([Moniker.adjective, Moniker.noun]);
let pkgJson = {};
try {
    pkgJson = require(path.resolve(process.cwd(), "./package.json"));
} catch (err) {
    console.error("no root package.json found", err);
}

function issueUrl () {
    if (pkgJson.repository && pkgJson.repository.url && ~pkgJson.repository.url.indexOf("github.com")) {
        return gufg(pkgJson.repository.url);
    }
    return `https://github.com/${pkgJson.repository}`;
}

const parserOpts = {
    headerPattern: /^(:\w*:)?\s*(\w*)(?:\((.*?)\))?\:?\s*(.*)$/,
    headerCorrespondence: ["emoji", "type", "scope", "subject"]
};

var scopes = [];

const writerOpts = {
    transform (commit) {
        const repoUrl = issueUrl();
        if (commit.emoji === ":tada:") {
            commit.type = ":tada: Features :tada:";
            commit.scope = "";
            commit.repeat = true;
            commit.subject = "First commit";
        } else if (commit.type === "feat") {
            commit.type = ":sparkles: Features :sparkles:";
        } else if (commit.type === "fix") {
            commit.type = ":ambulance: Bug Fixes :ambulance:";
        } else {
            return null;
        }

        if (typeof commit.subject !== "string" || commit.subject === "") {
            return null;
        }

        if (scopes.indexOf(commit.scope) !== -1) {
            commit.repeat = true;
        } else {
            scopes.push(commit.scope);
        }

        if (commit.scope === "*") {
            commit.scope = "";
        }

        if (typeof commit.hash === "string") {
            commit.hash = commit.hash.substring(0, 7);
        }

        if (typeof commit.subject === "string") {
            // GitHub issue URLs.
            commit.subject = commit.subject.replace(/#([0-9]+)/g, `[#$1](${repoUrl}/issues/$1)`);

            // GitHub user URLs.
            commit.subject = commit.subject.replace(/@([a-zA-Z0-9_]+)/g, "[@$1](https://github.com/$1)");
            commit.subject = commit.subject;
        }

        return commit;
    },
    groupBy: "type",
    commitsSort: ["scope", "subject"],
    mainTemplate: readFileSync(path.resolve(__dirname, "templates/template.hbs"), "utf-8"),
    headerPartial: readFileSync(path.resolve(__dirname, "templates/header.hbs"), "utf-8"),
    commitPartial: readFileSync(path.resolve(__dirname, "templates/commit.hbs"), "utf-8"),
    generateOn (commit, commits, context) {
        context.title = context.title || names.choose();
        if (commit.version) {
            scopes = [];
            context.title = names.choose();
        }
        return commit.version;
    }
};

module.exports = {
    parserOpts,
    writerOpts
};

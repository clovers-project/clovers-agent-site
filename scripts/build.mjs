import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
const files = [
  "index.html",
  "quickstart.html",
  "docs.html",
  "404.html",
  "CNAME",
  ".nojekyll",
  "examples/bot.py",
  "examples/clovers.toml",
];

function collectFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const source = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(source) : [source];
  });
}

files.push(...collectFiles(join(root, "assets")).map(path => relative(root, path)));

if (existsSync(output)) {
  const outputInfo = lstatSync(output);
  if (outputInfo.isSymbolicLink() || !outputInfo.isDirectory()) {
    throw new Error("dist must be a real directory.");
  }
} else {
  mkdirSync(output);
}

for (const file of files) {
  const source = resolve(root, file);
  const target = resolve(output, file);
  const targetRelative = relative(output, target);

  if (targetRelative.startsWith(`..${sep}`) || targetRelative === "..") {
    throw new Error(`Build target escapes dist: ${file}`);
  }
  if (!statSync(source).isFile() || lstatSync(source).isSymbolicLink()) {
    throw new Error(`Expected a file: ${file}`);
  }

  let targetDirectory = output;
  const directoryPath = dirname(targetRelative);
  if (directoryPath !== ".") {
    for (const part of directoryPath.split(sep)) {
      targetDirectory = join(targetDirectory, part);
      if (existsSync(targetDirectory)) {
        const directoryInfo = lstatSync(targetDirectory);
        if (directoryInfo.isSymbolicLink() || !directoryInfo.isDirectory()) {
          throw new Error(`Build directory is not a real directory: ${relative(output, targetDirectory)}`);
        }
      } else {
        mkdirSync(targetDirectory);
      }
    }
  }
  if (existsSync(target)) {
    const targetInfo = lstatSync(target);
    if (targetInfo.isSymbolicLink() || !targetInfo.isFile()) {
      throw new Error(`Build target is not a regular file: ${file}`);
    }
  }
  copyFileSync(source, target);
}

console.log(`Built ${files.length} files into ${relative(root, output)}.`);

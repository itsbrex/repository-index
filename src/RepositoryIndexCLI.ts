import { Option } from "commander";
import fs from "node:fs/promises";
import { simpleGit } from "simple-git";
import zod from "zod";
import { createSplitLinearLines } from "./chunk/splitLinearLines";
import { runProgram } from "./program/runProgram";

runProgram({
  name: "Repository Index",
  configurationOptions: [
    new Option(
      "--repository-path <string>",
      "Git repository path"
    ).makeOptionMandatory(),
  ],
  configurationSchema: zod.object({
    repositoryPath: zod.string(),
  }),
  async run({ repositoryPath }) {
    const git = simpleGit({
      baseDir: repositoryPath,
      binary: "git",
      maxConcurrentProcesses: 6,
      trimmed: false,
    });

    const files = (await git.raw(["ls-files"])).split("\n");

    for (const file of files) {
      if (!isSupportedFile(file)) {
        continue;
      }

      const content = await fs.readFile(`${repositoryPath}/${file}`, "utf8");

      const chunks = createSplitLinearLines({
        maxChunkCharacters: 150,
      })(content);

      for (const chunk of chunks) {
        console.log(chunk);
      }
    }
  },
});

function isSupportedFile(file: string) {
  return (
    file.endsWith(".js") ||
    file.endsWith(".ts") ||
    file.endsWith(".tsx") ||
    file.endsWith(".sh") ||
    file.endsWith(".yaml") ||
    file.endsWith(".yml") ||
    file.endsWith(".md") ||
    file.endsWith(".css") ||
    file.endsWith(".json") ||
    file.endsWith(".toml") ||
    file.endsWith(".config")
  );
}

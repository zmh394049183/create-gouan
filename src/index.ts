import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { copy, pkgFromUserAgent } from "./utils";
const cwd = process.cwd();
const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
};
const defaultTargetDir = "create-gouan";

const init = async () => {
  const response = await prompts([
    {
      type: "text",
      name: "packageName",
      message: "Input your packageName.",
      initial: defaultTargetDir,
    },
    {
      type: "select",
      name: "framework",
      message: "Pick your framework.",
      choices: [
        { title: "Vue", value: "vue" },
        { title: "React", value: "react" },
        { title: "Npm", value: "npm" },
        { title: "Next", value: "nextjs" },
      ],
      initial: 0,
    },
  ]);
  const { packageName, framework } = response;
  let target = `template-${framework}`;

  let targetDir = packageName || defaultTargetDir;
  const root = path.join(cwd, targetDir);

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    target
  );

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const files = fs.readdirSync(templateDir);

  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
  );

  pkg.name = packageName;

  write("package.json", JSON.stringify(pkg, null, 2) + "\n");

  const cdProjectName = path.relative(cwd, root);
  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
      }`
    );
  }
  switch (pkgManager) {
    case "yarn":
      console.log("  yarn");
      console.log("  yarn dev");
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
  console.log();
};

init().catch((e) => {
  console.error(e);
});

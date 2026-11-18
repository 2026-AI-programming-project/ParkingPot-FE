const { existsSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const env = { ...process.env };
const sdkRoot = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || (env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Android", "Sdk"));

if (sdkRoot) {
  env.ANDROID_HOME ||= sdkRoot;
  env.ANDROID_SDK_ROOT ||= sdkRoot;
  env.PATH = [path.join(sdkRoot, "emulator"), path.join(sdkRoot, "platform-tools"), env.PATH]
    .filter(Boolean)
    .join(path.delimiter);
}

if (!env.JAVA_HOME && env.ProgramFiles) {
  const androidStudioJava = path.join(env.ProgramFiles, "Android", "Android Studio", "jbr");
  if (existsSync(path.join(androidStudioJava, "bin", "java.exe"))) {
    env.JAVA_HOME = androidStudioJava;
    env.PATH = [path.join(androidStudioJava, "bin"), env.PATH].filter(Boolean).join(path.delimiter);
  }
}

const expoCli = path.join(__dirname, "..", "node_modules", "expo", "bin", "cli");
for (const args of [["prebuild", "--platform", "android"], ["run:android"]]) {
  const result = spawnSync(process.execPath, [expoCli, ...args], { env, stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}

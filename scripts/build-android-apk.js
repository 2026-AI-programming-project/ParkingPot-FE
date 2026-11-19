const { copyFileSync, existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const env = { ...process.env };
const sdkRoot = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || (env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Android", "Sdk"));

if (sdkRoot) {
  env.ANDROID_HOME ||= sdkRoot;
  env.ANDROID_SDK_ROOT ||= sdkRoot;
  env.PATH = [path.join(sdkRoot, "platform-tools"), env.PATH].filter(Boolean).join(path.delimiter);
}

if (!env.JAVA_HOME && env.ProgramFiles) {
  const androidStudioJava = path.join(env.ProgramFiles, "Android", "Android Studio", "jbr");
  if (existsSync(path.join(androidStudioJava, "bin", "java.exe"))) {
    env.JAVA_HOME = androidStudioJava;
    env.PATH = [path.join(androidStudioJava, "bin"), env.PATH].filter(Boolean).join(path.delimiter);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32" && command.toLowerCase().endsWith(".bat"),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

const expoCli = path.join(root, "node_modules", "expo", "bin", "cli");
run(process.execPath, [expoCli, "prebuild", "--platform", "android"], root);

const androidDir = path.join(root, "android");
const gradle = process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew";
run(gradle, [
  "app:assembleDebug",
  "-x", "lint",
  "-x", "test",
  "--configure-on-demand",
  "--build-cache",
  "-PreactNativeArchitectures=arm64-v8a",
  "--console=plain",
], androidDir);

const builtApk = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (!existsSync(builtApk)) throw new Error(`Expected debug APK at ${builtApk}`);
const outputDir = path.join(root, "dist");
mkdirSync(outputDir, { recursive: true });
const outputApk = path.join(outputDir, "ParkingPot-debug-arm64.apk");
copyFileSync(builtApk, outputApk);
console.log(`ARM64 debug APK created: ${outputApk}`);

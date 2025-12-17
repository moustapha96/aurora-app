const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "android", "capacitor.settings.gradle");

if (!fs.existsSync(file)) {
  console.log("capacitor.settings.gradle not found:", file);
  process.exit(0);
}

let txt = fs.readFileSync(file, "utf8");

const from = "new File('../node_modules/@capacitor/android/capacitor')";
const to = "new File('../node_modules/@capacitor/android')";

if (txt.includes(from)) {
  txt = txt.replace(from, to);
  fs.writeFileSync(file, txt, "utf8");
  console.log("Fixed capacitor-android path in capacitor.settings.gradle ✅");
} else {
  console.log("No fix needed (path already ok).");
}

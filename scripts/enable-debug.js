// run : node scripts/enable-debug.js

const fs = require("fs");
const path = require("path");

// Path to your Tauri config
const tauriConfigPath = path.join(__dirname, "../src-tauri/tauri.conf.json");

// Read the config file
try {
  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, "utf8"));

  // Ensure the windows array exists
  if (!tauriConfig.tauri.windows) {
    tauriConfig.tauri.windows = [];
  }

  // Add or update the first window configuration
  if (tauriConfig.tauri.windows.length === 0) {
    tauriConfig.tauri.windows.push({});
  }

  // Set devtools to true for the first window
  tauriConfig.tauri.windows[0].devtools = true;

  // Add the CLI configuration for debug features if it doesn't exist
  if (!tauriConfig.tauri.cli) {
    tauriConfig.tauri.cli = {
      description: "Your App",
      args: [],
    };
  }

  // Add the features argument if it doesn't exist
  const featuresArg = tauriConfig.tauri.cli.args?.find(
    (arg) => arg.name === "features",
  );
  if (!featuresArg) {
    if (!tauriConfig.tauri.cli.args) {
      tauriConfig.tauri.cli.args = [];
    }

    tauriConfig.tauri.cli.args.push({
      name: "features",
      short: "f",
      takesValue: true,
      multiple: true,
      description: "Features to enable",
      possibleValues: ["devtools"],
    });
  } else if (!featuresArg.possibleValues?.includes("devtools")) {
    featuresArg.possibleValues = [
      ...(featuresArg.possibleValues || []),
      "devtools",
    ];
  }

  // Write the updated config back to the file
  fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2));

  console.log("✅ Successfully enabled DevTools in Tauri config");
} catch (error) {
  console.error("❌ Failed to update Tauri config:", error);
  process.exit(1);
}

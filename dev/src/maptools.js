"use strict";

const fs = require("fs");
const json = require("./json.js");

const inputDir = "input/maps/";
const outputDir = "output/locations/";

function getDirList(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + "/" + file).isDirectory();
  });
}

function getMapName(mapName) {
  if (mapName.includes("bigmap")) {
    return "bigmap";
  } else if (mapName.includes("develop")) {
    return "develop";
  } else if (mapName.includes("factory4_day")) {
    return "factory4_day";
  } else if (mapName.includes("factory4_night")) {
    return "factory4_night";
  } else if (mapName.includes("interchange")) {
    return "interchange";
  } else if (mapName.includes("laboratory")) {
    return "laboratory";
  } else if (mapName.includes("rezervbase")) {
    return "rezervbase";
  } else if (mapName.includes("shoreline")) {
    return "shoreline";
  } else if (mapName.includes("woods")) {
    return "woods";
  } else {
    // ERROR
    return "";
  }
}

function getMapLoot() {
  let inputFiles = fs.readdirSync(inputDir);
  let i = 0;

  for (let file of inputFiles) {
    let filePath = inputDir + file;
    let fileName = file.replace(".json", "");
    let fileData = json.parse(json.read(filePath));
    let mapName = getMapName(fileName.toLowerCase());

    console.log("Splitting: " + filePath);
    let node = ("Location" in fileData) ? fileData.Location.Loot : fileData.Loot;

    for (let item in node) {
      let savePath = outputDir + mapName + "/loot/" + i++ + ".json";
      console.log("Loot." + fileName + ": " + item);
      json.write(savePath, node[item]);
    }
  }
}

function stripMapLootDuplicates() {
  for (let mapName of getDirList(outputDir)) {
    if (mapName === "hideout") {
      continue;
    }

    let dirName = outputDir + mapName + "/loot/";
    let inputFiles = fs.readdirSync(dirName);
    let mapLoot = {};
    let emptyLoot = {};
    let multipleLoot = {};
    let questLoot = {};

    console.log("Checking " + mapName);

    // get all items
    for (let file of inputFiles) {
      let filePath = dirName + file;
      let fileName = file.replace(".json", "");
      let fileData = json.parse(json.read(filePath));

      mapLoot[fileName] = json.stringify(fileData.Items);

      // check empty containers separately
      if (fileData.Items.length === 1) {
        emptyLoot[fileName] = fileData.Id;
      }

      // check multiple tpl
      if (fileData.Items.length > 1) {
        let tmp = [];

        for (let item of fileData.Items) {
          tmp.push(item._tpl);
        }

        tmp.splice(0, 1);
        multipleLoot[fileName] = json.stringify(tmp);
      }

      // check quest items separately	
     if (fileData.Id.includes("quest_")
      || fileData.Id.includes("controller_")
      || fileData.Id.includes("giroscope")
      || fileData.Id.includes("controller1")
      || fileData.Id.includes("case_0060")
      || fileData.Id.includes("loot_letter")
      || fileData.Id.includes("blood_probe")
      || fileData.Id.includes("loot_letter")
      || fileData.Id.includes("009_2_doc")
      || fileData.Id.includes("010_4_flash")
      || fileData.Id.includes("009_1_nout")
      || fileData.Id.includes("008_5_key")
      || fileData.Id.includes("010_5_drive")
      || fileData.Id.includes("loot 56(28)")
      || fileData.Id.includes("loot_case")
      || fileData.Id.includes("SAS")
      || fileData.Id.includes("chem_container")){ {	
        questLoot[fileName] = json.stringify(fileData.Position);	
      }
    }

    // check for items to remove
    for (let loot in mapLoot) {
      for (let file in mapLoot) {
        // don't check the same file
        if (loot === file) {
          continue;
        }

        // loot already exists
        if (mapLoot[loot] === mapLoot[file]
        || (loot in emptyLoot && file in emptyLoot && emptyLoot[loot] === emptyLoot[file])
        || (loot in multipleLoot && file in multipleLoot && multipleLoot[loot] === multipleLoot[file])
        || (loot in questLoot && file in questLoot && questLoot[loot] === questLoot[file])) {
          let target = dirName + file + ".json";

          console.log(mapName + ".duplicate: " + loot + ", " + file);
          fs.unlinkSync(target);
          delete mapLoot[file];

          if (file in emptyLoot) {
            delete emptyLoot[file];
          }

          if (file in multipleLoot) {
            delete multipleLoot[file];
          }

          if (file in questLoot) {	
            delete questLoot[file];	
          }
        }
      }
    }
  }
}

function renameMapLoot() {
  for (let mapName of getDirList(outputDir)) {
    if (mapName === "hideout") {
      continue;
    }

    let dirName = outputDir + mapName + "/loot/";
    let inputFiles = fs.readdirSync(dirName);

    console.log("Renaming " + mapName);

    for (let file in inputFiles) {
      let filePath = dirName + inputFiles[file];
      let fileData = json.parse(json.read(filePath));
      let target = "";

      // set target directory
      if (fileData.IsStatic) {
        target = dirName + "static/" + fileData.Id + "/" + "loot_" + file + ".json";
      } else if (fileData.Id.includes("quest_")) {
        target = dirName + "forced/" + fileData.Id + "/" + "loot_" + file + ".json";
      } else {
        target = dirName + "dynamic/" + fileData.Id + "/" + "loot_" + file + ".json";
      }

      // create missing dir
      let checkPath = target.substr(0, target.lastIndexOf('/'));

      if (!fs.existsSync(checkPath)) {
          fs.mkdirSync(checkPath, { recursive: true });
      }

      // move files
      fs.renameSync(dirName + inputFiles[file], target);
    }
  }
}

function getMapLootCount() {
  let inputFiles = fs.readdirSync(inputDir);

  for (let file of inputFiles) {
    let filePath = inputDir + file;
    let fileName = file.replace(".json", "");
    let fileData = json.parse(json.read(filePath));
    let mapName = getMapName(fileName.toLowerCase());
    let count = typeof fileData["Location"] === "undefined" ? fileData.Loot.length : fileData.Location.Loot.length;
    
    console.log(mapName + ".count: " + count);
  }
}

function map() {
  getMapLoot();
  stripMapLootDuplicates();
  renameMapLoot();
  getMapLootCount();
}

map();

const appRoot = require('app-root-path');
const { MessageEmbed } = require(appRoot.path + '/node_modules/discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const slashOptions = require(appRoot.path + '/global/slashOptions.js');
const utils = require(appRoot.path + '/global/utils.js');
const fs = require('fs');
const path = require('path');
const zip = require('zip-a-folder');

function copyRecursiveSync(src, dest) {
    let exists = fs.existsSync(src);
    let stats = exists && fs.statSync(src);
    let isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        fs.mkdirSync(dest);
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName),
                path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

function embedGuideFields(embed) {
    embed.addFields(
        {
            name: "Installation with Thunderstore (keeps mods up to date)",
            value: ""
                + "1. Install Thunderstore from thunderstore.io"
                + "\n2. Run Thunderstore app, select Lethal Company, create/select a profile."
                + "\n3. Search for and install the mods listed above as well as BepInEx."
                + "\n4. Launch from the \"Modded\" button in Thunderstore to run Lethal Company with mods."
                + "\n4. Custom Boombox Music (Optional): grab mp3s from the zip. See \"Custom Boombox Music\" page on Thunderstore for more info.",
            inline: false
        },
        {
            name: "Installation without Thunderstore",
            value: ""
                + "1. Go to your Lethal Company Steam folder (In Steam, right click game, Manage > Browse local files)."
                + "\n2. Extract contents of zipped folder (within lc-mods... folder) to Lethal Company folder."
                + "\n3. The new BepInEx folder, .ini, and .dll files should live next to Lethal Company.exe",
            inline: false
        }
    );
    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lcmods')
        .setDescription('Get assets.')
        .addBooleanOption((option) => slashOptions.hidden(option, false))
        .addBooleanOption((option) => option
            .setName('guide')
            .setDescription('Get installation instructions.')
            .setRequired(false)
        ),
    async execute(client, interaction) {
        const { options } = interaction;
        let user = interaction.user;
        let isHidden = options.getBoolean('hidden');
        let hasGuide = options.getBoolean('guide');
        await interaction.deferReply({ ephemeral: isHidden });

        // check/create output folder
        outputDir = appRoot + "\\output\\LethalCompany\\";
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(appRoot + "\\output\\");
            fs.mkdirSync(outputDir);
        }

        // check/get mod config
        let modConfigPath = outputDir + "lc-mods-config.json";
        if (!fs.existsSync(modConfigPath)) {
            interaction.editReply({
                content: "lc-mods-config.json not found. Create one with entry \"modSrc\": [path]",
                ephemeral: true
            });
            return;
        }
        let modConfig = utils.getJSON(modConfigPath);

        // get/create lc-mods-data.json
        let modData;
        let modDataPath = outputDir + "lc-mods-data.json"
        if (!fs.existsSync(modDataPath)) {
            modData = {
                "prevDateStr": 0,
                "modNum": -1
            }
            fs.appendFileSync(modDataPath, JSON.stringify(modData, null, 4));
        }
        modData = utils.getJSON(modDataPath);

        // delete existing mod folders
        fs.readdirSync(outputDir).forEach((subfolder) => {
            if (subfolder.startsWith("lc-mods") && (!subfolder.includes(".") || subfolder.includes(".zip"))) {
                fs.rmSync(outputDir + subfolder, { recursive: true });
            }
        });

        // create new mod folder
        let date = new Date();
        let year = ("" + date.getFullYear()).substr(2);
        let month = ("" + (date.getMonth() + 1)).padStart(2, 0);
        let day = ("" + date.getDate()).padStart(2, 0);
        let dateStr = year + month + day;
        if (dateStr == modData.prevDateStr) { modData.modNum += 1; }
        else { modData.modNum = 1; }
        let modFilename = "lc-mods_" + dateStr + "-" + ("" + modData.modNum).padStart(2, 0);
        let modDest = outputDir + modFilename;
        fs.mkdirSync(modDest);
        modData.prevDateStr = dateStr;
        utils.setJSON(modDataPath, modData);

        // copy mod files
        let filenames = [
            "doorstop_config.ini",
            "winhttp.dll",
            "BepInEx"
        ];
        let src;
        let allFilesExist = true;
        filenames.forEach(async (filename) => {
            src = modConfig.modSrc + filename;
            if (!fs.existsSync(src)) {
                await interaction.editReply({
                    content: filename + " not in source folder.",
                    ephemeral: true
                });
                allFilesExist = false;
                return;
            };
            copyRecursiveSync(src, modDest + "\\" + filename);
        });
        if (!allFilesExist) { return; }

        // delete copied LogOutput.log
        let copiedLog = modDest + "\\BepInEx\\LogOutput.log";
        if (fs.existsSync(copiedLog)) { fs.unlinkSync(copiedLog); }

        // get mod names, version nums
        let pluginsFolder = modDest + "\\BepInEx\\plugins\\";
        let modNames = [];
        fs.readdirSync(pluginsFolder).forEach((pluginFolder) => {
            try { modNames.push(utils.getJSON(pluginsFolder + pluginFolder + "\\manifest.json").name); }
            catch { modNames.push("[ERR-N] " + pluginFolder); }
        });
        let versionNums = [];
        fs.readdirSync(pluginsFolder).forEach((pluginFolder) => {
            try { versionNums.push(utils.getJSON(pluginsFolder + pluginFolder + "\\manifest.json").version_number); }
            catch { modNames.push("[ERR-V] " + pluginFolder); }
        });
        modNamesVersions = modNames.map((modName, index) => modName + " (" + versionNums[index] + ")");

        // create message embed
        let cutoffSingleCol = 3;
        let modsEmbed = new MessageEmbed();
        if (modNames.length < cutoffSingleCol) {
            modsEmbed.addFields({
                name: "**Lethal Company Mods**",
                value: modNames.map(modName => bulletPt + modName).sort().join("\n"),
                inline: true
            });
        }
        else { utils.makeEmbedColumns(cutoffSingleCol, 1, 2, modNamesVersions, "**Lethal Company Mods**", modsEmbed); }
        if (hasGuide) { embedGuideFields(modsEmbed);}

        // zip and send
        await zip.zip(modDest, modDest + ".zip")
        try {   
            await interaction.editReply({
                embeds: [modsEmbed],
                files: [modDest + ".zip"],
                // files: outputDir + "Newfolder.zip",
                ephemeral: isHidden == null ? false : isHidden,
            }).catch((err) => {
                interaction.editReply({
                    embeds: hasGuide ? [modsEmbed] : null,
                    content: "Potentially rate limited. Try again later for zip file.",
                    ephemeral: true
                })
            });
        }
        catch (err) {
            console.log(err);
            await interaction.editReply({
                content: "An error occurred.",
                ephemeral: true,
            });
        }

        // delete folder (keep zip)
        try { fs.rmSync(modDest, { recursive: true }); }
        catch { console.log("Error deleting new folder."); }

        // update/create outputlog.txt
        let outlogPath = outputDir + "log-output.txt";
        let newlogtxt = date.toLocaleString().replace(" ", "") + " — " + user.id + " (" + user.username + ") " + "generated " + modFilename;
        var logStream = fs.createWriteStream(outlogPath, {flags: 'a'});
        logStream.write(newlogtxt + "\n");
        logStream.end();
    }
}
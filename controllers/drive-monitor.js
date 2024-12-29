import { google } from "googleapis";
import { chapterService } from "../services/Chapter.Service.js";
import fs from "fs/promises";
import path from "path";
import sanitize from "sanitize-html";

/**
 * Absolutely not the prettiest and redundancies are everywhere
 * Tried to save the monitor.json into Mongo but always would
 * be wiped after running monitor/start in new deployment.
 * This is just a temp fix
 *
 *
 * Check kat-edition-last-stable for that broken version,
 * if you can fix it, that's be nice. I have 0 experience with mongo
 */

// Centralized logging configuration
const log = {
  info: (...args) => console.log(new Date().toISOString(), "INFO:", ...args),
  error: (...args) =>
    console.error(new Date().toISOString(), "ERROR:", ...args),
  warn: (...args) => console.warn(new Date().toISOString(), "WARN:", ...args),
  debug: (...args) =>
    console.debug(new Date().toISOString(), "DEBUG:", ...args),
};

/**
 * DriveMonitor class handles monitoring Google Drive folders for new files
 * and processes them into chapters in the database
 */
export class DriveMonitor {
  constructor() {
    this.chapterService = chapterService;

    // Configuration object to manage monitor state
    this.config = {
      folders: new Map(),
      processedFiles: new Map(),

      // Path to the config file
      configFilePath: path.join(process.cwd(), "config", "monitor.json"),

      // Load config from file
      async loadConfig() {
        try {
          const configData = await fs.readFile(this.configFilePath, "utf-8");
          const config = JSON.parse(configData);

          // Load folders and processedFiles, handling potential empty data
          this.folders = new Map(Object.entries(config.folders || {}));
          this.processedFiles = new Map(
            Object.entries(config.processedFiles || {})
          );

          log.info("Configuration loaded successfully from file");
        } catch (error) {
          if (error.code === "ENOENT") {
            // If the file doesn't exist, create an empty config
            log.info("Config file not found. Creating a new one.");
            await this.saveConfig();
          } else {
            log.error("Failed to load config from file:", error);
            throw error; // Re-throw to stop initialization
          }
        }
      },

      // Save config to file
      async saveConfig() {
        try {
          const configObj = {
            folders: Object.fromEntries(this.folders),
            processedFiles: Object.fromEntries(this.processedFiles),
          };

          await fs.writeFile(
            this.configFilePath,
            JSON.stringify(configObj, null, 2)
          );
          log.info("Configuration saved successfully to file");
        } catch (error) {
          log.error("Failed to save config to file:", error);
          throw error;
        }
      },
    };

    this.monitorInterval = null;
    this.isMonitoring = false;
  }

  /**
   * Initializes the Google Drive connection
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Load configuration from the file
      await this.config.loadConfig();

      // if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
      //   throw new Error('GOOGLE_SERVICE_ACCOUNT environment variable is not set');
      // }

      const credentials = {
        type: "service_account",
        project_id: "upload-recover-like-crazy",
        private_key_id: "a141fb39a6df9b6fb55726c21a51756126edf346",
        private_key:
          "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCJ9aN3sWG17GGg\ntPqIT+bWdafgXMP5AivOWO3MwrkbV60l58lRGyCEUqoioZ48Vjz+w1EViqNx+k2X\nRNo+NotOIGtwGAYXWgGWsSVTL2toKJ71m86lD9Ty3Z4oVsBvd9askDuPfeobiMDd\ntCxEAssXM9VOy2FItDBR+arxv+kZQdzobl/cRF02Rj4UiUtfQnWaD+MifGHqlP+g\naybikoj4iO35FBi9PnHRnsXpfnTJIblqvSq2Zs+QbV+6eYJPUursdGxcPPbAsF5t\nRj2dK0Mw5P54aCQPcm42MS3yzHNFhFGIsYGO0xVtC/Ycs7/3i3W6WvSDQx01GRMb\nUOtTv3oHAgMBAAECggEACra2SqnOVkP0svfLCwH1gcsiTeS2XWSjRUOXuBKZMHvn\nGO3+rttF87C9wLG/aZ0i4IAHkH4zQjs3gltY/YLb36XZ4hsjgfW98Ndx+BtTIoQh\nEB7Y9e2cUn4OdcCC8kUiuUT8MyEKqLe+jpka5O84mWUvmA5oUC6aIAudEGggcJMV\nJdYUG0+H0lZxlav3u0OSwUjUt6gER8PVMscZCloC6R5onwjdBz09ODyRp0VERjWE\nffA79E8SD4Ni9+J/iAN3ulH7lcd1rkLJV1vHZJzbyj9iV1PpR4hH5KWIRUZihatj\n4jn+YrEeJyMTJk4NRYOHqbtcr35/upVgUTbYrJyUZQKBgQC8KiJcvfSswMFJ9p43\nci36yNNuHcqnQIkJ/fTa4JJO+RpNP3sk8hpkOvbx3pRWfvohSphwcizb2GyYwTQ0\n5jILpe237TUo0boI3Nj/fDOn5HXB+tWwjRu/9KikAJftf5zNJRd2m6ixcdcR5acp\ntTJIJxAjZ/7PCpvybM1fmqWMjQKBgQC7sgmemaObioGP8HhMhtSmCCi24ugBcmJt\nKohp9rstV0OvXXMF8k+QeCjTxiiwVfxNIYpdCLIMiZRBt2E/gJFuPNuqaTGHrcz7\nmJG48NfMCJjBEde7yuSN958th7z4dBiur2jRpjT8hvpUCYSSqNGWIpg7bAnr4FeC\nLthbSV994wKBgEGelAMxv40rX3zyw3RknkJSHOHPA+hV6jSQ2v4lyQA/gPulgsV8\npNWFdq8cxzBu8b4AbK7yMlCs5hpTbmhwSs2jHQbCc4J7uVvz4L0gTEdltedjGXiL\njTzhDpq7FkCd+0nTgJ49ZJQVNkKoiyZRaWqeLNOcJdGASqg9Z1XK8abVAoGAaWTP\ngf9Dn1Nm7SxaYJ5VSeXK9uby390a57G6Z8Xj1NHrb81JiU1G4BiY1FGxB1NBGQ58\nY0E+uUuHtF8EfGP1RbFmp4nqBgXR1HUXXoHeqvMo00DxosGLFSy2dRqDQf/u3Cgi\n85YgqqwgZI/zoWaqSWOjl7pS1+BhQviLBLdup4ECgYBpZCEYIC2YoMCFfYiDheN/\navq1EDhesQZqGJyz/LA/wOucr4+1bohI6+8RAGbjOQBm9plCW8uQHAfxmcDuiwLh\niIU8Xo0s17Zyeu1uqDqcJTaaHALCEUFkugXYmZDaytN1BblZNFSBKhe+m258EIx2\nsgGtvC6PTZx2JgZy3WZJLw==\n-----END PRIVATE KEY-----\n",
        client_email:
          "greenz@upload-recover-like-crazy.iam.gserviceaccount.com",
        client_id: "110000531219951384745",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url:
          "https://www.googleapis.com/robot/v1/metadata/x509/greenz%40upload-recover-like-crazy.iam.gserviceaccount.com",
        universe_domain: "googleapis.com",
      };
      const requiredFields = ["client_email", "private_key", "project_id"];
      const missingFields = requiredFields.filter(
        (field) => !credentials[field]
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Service account credentials missing required fields: ${missingFields.join(
            ", "
          )}`
        );
      }

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      this.drive = google.drive({
        version: "v3",
        auth,
      });

      this.initialized = true;
      log.info("Drive monitor initialized successfully");
    } catch (error) {
      this.initialized = false;
      log.error("Failed to initialize drive monitor:", error);
      throw error;
    }
  }

  /**
   * Starts the monitoring process
   */
  async startMonitoring() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (this.isMonitoring) {
        return;
      }

      this.isMonitoring = true;
      const interval = process.env.MONITOR_INTERVAL || 60;

      // Process folders immediately
      await this.processAllFolders().catch((error) => {
        console.error("Error in initial folder processing:", error);
      });

      // Then set up the interval
      this.monitorInterval = setInterval(() => {
        this.processAllFolders().catch((error) => {
          console.error("Error in interval folder processing:", error);
        });
      }, interval * 60 * 1000);
    } catch (error) {
      this.isMonitoring = false;
      throw error;
    }
  }

  /**
   * Stops the monitoring process
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    log.info("Drive monitor stopped");
  }

  /**
   * Checks if the service account has access to the specified folder
   */
  async checkFolderPermissions(folderId) {
    try {
      log.info(`Checking permissions for folder: ${folderId}`);

      const response = await this.drive.files.get({
        fileId: folderId,
        fields: "capabilities",
        supportsAllDrives: true,
      });

      const hasAccess =
        response.data.capabilities?.canReadDrive ||
        response.data.capabilities?.canReadTeamDrive ||
        response.data.capabilities?.canDownload;

      return hasAccess;
    } catch (error) {
      if (error.code === 404 || error.code === 403) {
        log.warn(`No access to folder ${folderId}`);
        return false;
      }
      throw error;
    }
  }

  /**
   * Sorts files by name with special handling for numbered files
   */
  sortFiles(files) {
    return files.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      // Use parseFloat to handle decimals
      const numA = parseFloat(nameA.match(/^(\d+(?:\.\d+)?)/)?.[1]);
      const numB = parseFloat(nameB.match(/^(\d+(?:\.\d+)?)/)?.[1]);

      // 1. Both are numbers: Compare numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      // 2. One is a number: Number comes first
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;

      // 3. Both are strings: Compare alphabetically
      return nameA.localeCompare(nameB);
    });
  }

  /**
   * Lists all files in a specified folder
   */
  async listFilesInFolder(folderId) {
    try {
      const hasAccess = await this.checkFolderPermissions(folderId);
      if (!hasAccess) {
        throw new Error(
          `Service account does not have access to folder ${folderId}`
        );
      }

      let allFiles = [];
      let pageToken = null;

      do {
        const response = await this.drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: "nextPageToken, files(id, name, mimeType, createdTime, size)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
          pageToken: pageToken, // Include pageToken for subsequent requests
        });

        allFiles = allFiles.concat(response.data.files);
        pageToken = response.data.nextPageToken;
      } while (pageToken);

      return this.sortFiles(allFiles);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Downloads a file from Google Drive
   */
  async downloadFileToBuffer(fileId, mimeType) {
    try {
      if (this.isGoogleDocsFile(mimeType)) {
        const content = await this.exportGoogleDoc(fileId);
        return Buffer.from(content);
      } else {
        const response = await this.drive.files.get(
          { fileId, alt: "media" },
          { responseType: "arraybuffer" }
        );
        return Buffer.from(response.data);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Exports a Google Doc to HTML format
   */
  async exportGoogleDoc(fileId) {
    try {
      const response = await this.drive.files.export({
        fileId,
        mimeType: "text/html",
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checks if a file is a Google Docs file
   */
  isGoogleDocsFile(mimeType) {
    return mimeType === "application/vnd.google-apps.document";
  }

  /**
   * Processes a single file into a chapter
   */
  async processFile(file, folderConfig) {
    try {
      const contentBuffer = await this.downloadFileToBuffer(
        file.id,
        file.mimeType
      );
      const rawContent = contentBuffer.toString("utf-8");

      // Modified to remove suggestions and comments from Google Docs content
      const cleanContent = rawContent
        .replace(
          /<span[^>]*class="[^"]*suggestions?[^"]*"[^>]*>.*?<\/span>/g,
          ""
        )
        .replace(/<span[^>]*class="[^"]*comment[^"]*"[^>]*>.*?<\/span>/g, "");

      const content = sanitize(cleanContent, {
        allowedTags: ["b", "i", "u", "s", "a", "p", "br", "span", "div"], // Allow 'span' and 'div' for styles
        allowedAttributes: {
          a: ["href", "target"], // Allow 'target' for links
          "*": ["style"],
        },
        allowedStyles: {
          "*": {
            "font-weight": [
              /^(?:bold|bolder|lighter|normal|100|200|300|400|500|600|700|800|900)$/i,
            ],
            "font-style": [/^(?:italic|oblique|normal)$/i],
            "text-decoration": [/^(?:underline|line-through|overline|none)$/i],
          },
        },
      });

      const chapterData = {
        title: file.name,
        content: content,
        seriesId: folderConfig.seriesId,
        isPremium: folderConfig.isPremium || false,
        price: folderConfig.price || 0,
      };

      let chapter;
      try {
        chapter = await this.chapterService.create(chapterData);
      } catch (error) {
        if (error.code === 11000 || error.message.includes("duplicate key")) {
          log.error(
            `Duplicate chapter detected for file: ${file.name}, skipping...`
          );
          // Continue to the next file instead of returning
          return "duplicate"; // Indicate a duplicate was found
        } else {
          // Re-throw other errors to be handled at a higher level
          throw error;
        }
      }

      log.info(`Chapter created successfully`, {
        chapterId: chapter.id,
        title: chapter.title,
        seriesId: chapter.seriesId,
      });

      this.config.processedFiles.set(file.id, {
        processedAt: new Date().toISOString(),
        seriesId: folderConfig.seriesId,
        chapterId: chapter.id,
        name: file.name,
        type: file.mimeType,
      });

      await this.config.saveConfig();
      return chapter;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adds a new folder to monitor
   */
  async addFolder(folderId, seriesId, isPremium = false, price = 0) {
    try {
      const hasAccess = await this.checkFolderPermissions(folderId);
      if (!hasAccess) {
        throw new Error(`No access to folder ${folderId}`);
      }

      // Add the new folder to the Map
      this.config.folders.set(folderId, {
        seriesId,
        isPremium,
        price,
        addedAt: new Date().toISOString(),
      });

      // Save the updated configuration
      await this.config.saveConfig();

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Processes all monitored folders
   */
  async processAllFolders() {
    try {
      const processedCount = {
        folders: 0,
        chapters: 0,
        errors: 0,
      };

      for (const [folderId, folderConfig] of this.config.folders) {
        try {
          const files = await this.listFilesInFolder(folderId);

          for (const file of files) {
            if (!this.config.processedFiles.has(file.id)) {
              await this.processFile(file, folderConfig);
              processedCount.chapters++;
            }
          }

          processedCount.folders++;
        } catch (error) {
          processedCount.errors++;
          console.error(`Failed to process folder ${folderId}:`, error);
        }
      }

      // Save the updated configuration after processing
      await this.config.saveConfig();

      return processedCount;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the Google Drive credentials
   */
  async validateCredentials() {
    try {
      const response = await this.drive.about.get({
        fields: "user",
      });
      return response.data.user;
    } catch (error) {
      throw error;
    }
  }
}

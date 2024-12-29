import { DriveMonitor } from './drive-monitor.js';

let monitorInstance = null;

export const checkMonitorInitialized = (req, res, next) => {
  if (!monitorInstance) {
    return res.status(400).json({ error: 'Drive monitor not initialized' });
  }
  next();
};

export const Str_monitor = async (req, res) => {
  try {
    // ... (Your existing code to handle resuming or checking if already running) ...

    // If the monitor doesn't exist, create a new one.
    monitorInstance = new DriveMonitor();
    await monitorInstance.initialize();

    // ALWAYS start monitoring, even if no folders are configured initially
    await monitorInstance.startMonitoring(); 

    return res.json({
      message: monitorInstance.config.folders.size > 0
        ? 'Drive monitor started successfully'
        : 'Drive monitor initialized but no folders configured (monitoring active)',
      status: 'running', // Since monitoring has started
      folderCount: monitorInstance.config.folders.size,
      processedFilesCount: monitorInstance.config.processedFiles.size
    });

  } catch (error) {
    console.error('Start monitor error:', error);
    monitorInstance = null; // Reset the instance in case of error
    return res.status(500).json({
      error: 'Failed to start drive monitor',
      details: error.message
    });
  }
};

export const Stp_monitor = (req, res) => {
  try {
    if (!monitorInstance) {
      return res.status(400).json({ error: 'Monitor not running' });
    }

    monitorInstance.stopMonitoring();
    // Don't set monitorInstance to null, just stop the monitoring
    // This preserves the configuration

    res.json({
      message: 'Drive monitor stopped successfully',
      status: 'stopped'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop drive monitor',
      details: error.message
    });
  }
};

export const Stat_Monitor = (req, res) => {
  try {
    res.json({
      status: monitorInstance ? (monitorInstance.isMonitoring ? 'running' : 'stopped') : 'not initialized',
      folderCount: monitorInstance ? monitorInstance.config.folders.size : 0,
      processedFilesCount: monitorInstance ? monitorInstance.config.processedFiles.size : 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get monitor status',
      details: error.message
    });
  }
};

export const Update_Monitor = async (req, res) => {
  try {
    if (!monitorInstance) {
      return res.status(400).json({ error: 'Monitor not running' });
    }

    await monitorInstance.processAllFolders();
    res.json({
      message: 'Manual folder check completed',
      folderCount: monitorInstance.config.folders.size,
      processedFilesCount: monitorInstance.config.processedFiles.size
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process folders',
      details: error.message
    });
  }
};

export const New_Folder = async (req, res) => {
  try {
    if (!monitorInstance) {
      // If monitor isn't initialized, create it but don't start monitoring
      monitorInstance = new DriveMonitor();
      await monitorInstance.initialize();
    }

    const { folderId, seriesId, isPremium, price } = req.body;

    if (!folderId || !seriesId) {
      return res.status(400).json({
        error: 'Missing required parameters'
      });
    }

    await monitorInstance.addFolder(folderId, seriesId, isPremium, price);

    res.json({
      message: 'Folder added successfully',
      folderCount: monitorInstance.config.folders.size
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to add folder',
      details: error.message
    });
  }
};
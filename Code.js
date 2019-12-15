var sheetName = "Script";
var namedRangeName = "Script";
var preprodEnv = "Q";
var prodEnv = "P";

var personColumn = 0;
var taskColumn = 1;
var dbColumn = 2;
var typeColumn = 3;
var scriptColumn = 4;
var qaColumn = 5;
var skipColumn = 6;
var dateColumn = 7;

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Download Scripts')
      .addItem('Preprod Scripts', 'downloadPreprodScripts')
      .addItem('Prod Scripts', 'downloadProdScripts')
      .addItem('Complete Deployment', 'completeDeployment')
      .addToUi();
}

function downloadPreprodScripts() {
  var t = HtmlService.createTemplateFromFile('download');
  t.data = getPreprodTable();
  t.environment = preprodEnv;
  t.description = "Bu alanda sadece QA kolonu işaretlenmemişler gelmektedir.";
  var html = t.evaluate();
  SpreadsheetApp.getUi().showModalDialog(html, 'Preprod Scripts');
}

function getPreprodTable() {
  var rawData = getPreprodData();
  return getGroupedData(rawData);
}

function getGroupedData(rawData) {
  var groupedData = [];

  rawData.forEach(function (d) {
    var database = d[dbColumn];
    var type = d[typeColumn];
    var matched = false;

    groupedData.forEach(function (g) {
      if (g[0] == database && g[1] == type) {
        g[2] += 1;
        matched = true;
      }
    });

    if (!matched) {
      groupedData.push([database, type, 1, 'Button']);
    }
  });

  var data = [];
  groupedData.forEach(function (g) {
    data.push([g[0], g[1], g[2]]);
  });
  return data;
}

function getPreprodData() {
  var rawData = getAllValues();
  var data = [];

  rawData.forEach(function (d) {
    if (d[qaColumn] === false) { data.push(d); }
  });

  return data;
}

function downloadProdScripts() {
  var t = HtmlService.createTemplateFromFile('download');
  t.data = getProdTable();
  t.environment = prodEnv;
  t.description = "Bu alanda sadece Skip kolonu işaretlenmemişler bulunmaktadır.";
  var html = t.evaluate();
  SpreadsheetApp.getUi().showModalDialog(html, 'Prod Scripts');
}

function getProdTable() {
  var rawData = getProdData();
  return getGroupedData(rawData);
}

function getProdData() {
  var rawData = getAllValues();
  var data = [];

  rawData.forEach(function (d) {
    if (d[skipColumn] === false) { data.push(d); }
  });

  return data;
}

function getAllValues() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var range = sheet.getRange(namedRangeName);
  var rawValues = range.getValues();
  var values = [];
  for (var i = 0; i < rawValues.length; i++) {
    if (!rawValues[i][scriptColumn]) continue;
    values.push(rawValues[i]);
  }

  return values;
}

function getFileId(filename, data) {
  var blob = Utilities.newBlob("").setDataFromString(data,"UTF-16");
  blob.setName(filename);
  var file = DriveApp.createFile(blob);
  var downloadURL = file.getDownloadUrl().replace("?e=download&gd=true","");
  return downloadURL;
}

function getDownloadUrl(env, dbName, type) {
  var data;
  if (env == preprodEnv) {
    data = getPreprodData();
  } else if (env == prodEnv) {
    data = getProdData();
  } else {
    throw new Error("Unknown env: " + env);
  }
  var spacer = "\n--------------------------------------------- \n\n";
  var script = "Use " + dbName + "\n\n";
  for (var i = 0; i < data.length; i++) {
    if (data[i][dbColumn] != dbName || data[i][typeColumn] != type) continue;
    script = script + spacer;
    script = script + "\t--Owner: \t"+ data[i][personColumn] + "\n";
    script = script + "\t--Task: \t"+ data[i][taskColumn] + "\n";
    script = script + "\t--Type: \t"+ data[i][typeColumn] + "\n\n";
    script = script + data[i][scriptColumn] + "\n";
  }

  var fileName = dbName + "_" + type + ".sql";
  var downloadId = getFileId(fileName, script);
  return downloadId;
}

function completeDeployment(){
  var done = HtmlService.createTemplateFromFile('transport');
  done.data = getPreprodTable();
  var html = done.evaluate();
  SpreadsheetApp.getUi().showModalDialog(html, 'HelloBro');
}

function transportData() {
  var transData = getAllValuesWithDate();
  scriptToHistoryMapper(transData);
}

function getAllValuesWithDate() {
  var data = getProdData();
  var date = Utilities.formatDate(new Date(), "GMT+3", "dd/MM/yyyy")
  var endDate = date

  for (var i = 0; i < data.length; i++) {
    if (data[skipColumn] === false) continue;
    data[i][dateColumn]=endDate;
  }
  return data;
}

function test(){
  // Test
  transportData();
}

function scriptToHistoryMapper(data) {
  var historyPersonColumn = 0;
  var historyTaskColumn = 1;
  var historyDbColumn = 2;
  var historyTypeColumn = 3;
  var historyScriptColumn = 4;
  var historyProdDateColumn = 5;

  var historyData = [];

  for (var i = 0; i < data.length; i++) {
    historyData[i][historyPersonColumn]= data[i][personColumn];
    historyData[i][historyTaskColumn]= data[i][taskColumn];
    historyData[i][historyDbColumn]= data[i][dbColumn];
    historyData[i][historyTypeColumn]= data[i][typeColumn];
    historyData[i][historyScriptColumn]= data[i][scriptColumn];
    historyData[i][historyProdDateColumn]= data[i][dateColumn];
    Logger.log(historyData);
  }
}

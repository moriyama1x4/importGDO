function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [
    {
      name : "スコアインポート",
      functionName : "importGdo"
    }
  ];
  sheet.addMenu("スクリプト実行", entries);
};

function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [
    {
      name : "スコアインポート",
      functionName : "importGdo"
    },
    {
      name : "目標設定",
      functionName : "setGoal"
    }
  ];
  sheet.addMenu("スクリプト実行", entries);
};

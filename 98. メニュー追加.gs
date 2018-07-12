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
    },
    {
      name : "ラウンド削除",
      functionName : "clearRound"
    }
  ];
  sheet.addMenu("スクリプト実行", entries);
};

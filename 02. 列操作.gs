function addRows(rowsNum) {
  var sheets = [sheetInput, sheetTotal, sheetHole]; //自動拡張するときなぜかinputが先じゃないとバグる
  
  
  sheets.forEach(function(sheet, index){
    var row = sheet.getLastRow();
    
    sheet.getRange(row + 2, 1, rowsNum, 1).setValue(''); //空値をセットしてシート拡張
    sheet.getRange(row, 1, 1, sheet.getLastColumn()).copyTo(sheet.getRange(row + 1, 1, rowsNum, 1)); //烈コピー
    sheet.getRange(row - 1, 1, 1, sheet.getLastColumn()).copyTo(sheet.getRange(row, 1, rowsNum, 1), {formatOnly:true}); //書式コピー
    
    //inputのみclearする
    if(index == 0){
      clearRows(row + 1, rowsNum);
    }
  });
}

function　clearRows(row, rowsNum){
		sheetInput.getRange(row, 6, rowsNum, 3).setBackground('#ffffff');　//黄色セル初期化
		
		//諸々クリア
		sheetInput.getRange(row, 2, rowsNum, 43).setValue('');
		sheetInput.getRange(row, 63, rowsNum, 18).setValue('');
		sheetInput.getRange(row, 99, rowsNum, 18).setValue('');
}
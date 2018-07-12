function clearRound() {
  var sheetData = sheetInput.getDataRange().getValues();
  var roundNum;
  var row;
  
  for(var i = 0; true; i++){
    if(sheetData[3 + i][1] == ''){
      break;
    }else{
      roundNum = sheetData[3 + i][1];
    }
  }
    
  while(true){
    var inputClearNum = Browser.inputBox('消去列入力','直近何回を削除しますか？(全' + roundNum + '回)',Browser.Buttons.OK_CANCEL);

    if(inputClearNum == 'cancel'){
      return;
    }else if(inputClearNum > 0 && inputClearNum < roundNum + 1){
      row = (roundNum + 3) - (Number(inputClearNum) - 1);
      break;
    }else{
      Browser.msgBox('正しい値を入力してください(半角数字1~' + roundNum + ')',Browser.Buttons.OK);
    }
  }
  
  clearRows(row, roundNum);
}

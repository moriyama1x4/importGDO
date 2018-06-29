function setGoal() {
  
  //未完了のラウンドを取得
  var planRow = [];
  for(var i = 0; true; i++){
    if(getData(4+i,2) == ''){
      break;
    }else if(getData(4+i,3).match(/\(/)){
      planRow.push(4+i);
    }
  }
  

  planRow.forEach(function(value){
    var pars = sheetInput.getRange(value,9,1,18).getValues()[0];
    var totalPar = 0;
    pars.forEach(function(value){
      totalPar += value;
    });
    var goalScore = sheetTotal.getRange(value,12).getValue();
    var baseHDCP = Math.floor((goalScore - totalPar)/18); //全ホールにつくハンディ
    var addHDCP = (goalScore - totalPar) - (18 * baseHDCP); //追加でハンディがつくホール数
    var courseHDCPs = sheetInput.getRange(value,99,1,18).getValues()[0];
    var courseHDCP = 0;
    courseHDCPs.forEach(function(value){
      courseHDCP += value;
    });
    var score = [];
    pars.forEach(function(value){
      score.push(value + baseHDCP);
    });
    
    if(courseHDCP == 171){//コースハンディ1~18の時
      for(var i = 0; i < 18; i++){
        if(courseHDCPs[i] <= addHDCP){
          score[i] ++;
        }
      }
    }else if(courseHDCP == 90){//コースハンディ1~9が2つの時
       for(var i = 0; i < 2; i++){
         for(var j = 0; j < 9; j++){
           if(courseHDCPs[j + (9*i)] <= (Math.ceil(addHDCP/2) - 1*i*(addHDCP%2))){
             score[j + (9*i)] ++;
           }
         }
      }
    }else{//その他(コースハンディなしの時 など)
      var priority = [];
      pars.forEach(function(value,index){
        if(value == 5){
          priority.push(index);
        }
      });
      pars.forEach(function(value,index){
        if(value == 4){
          priority.push(index);
        }
      });
      pars.forEach(function(value,index){
        if(value == 3){
          priority.push(index);
        }
      });
      
      for(var i = 0; i < addHDCP; i++){
        score[priority[i]] ++;
      }
    }
    
    //目標スコア入力
    sheetInput.getRange(value,27,1,18).setValues([score]);
  });
}


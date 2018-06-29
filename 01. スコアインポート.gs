var sheetTotal = SpreadsheetApp.getActive().getSheetByName('全体');
var sheetHole = SpreadsheetApp.getActive().getSheetByName('ホール別');
var sheetInput = SpreadsheetApp.getActive().getSheetByName('input');

function importGdo() {
  var loginUrl = 'https://usr.golfdigest.co.jp/pg/frlogin.php';
  var id = PropertiesService.getScriptProperties().getProperty('ID');
  var password = PropertiesService.getScriptProperties().getProperty('PASSWORD');
  var loginOptions = {
    method : 'post',
    followRedirects: false,
    contentType: 'application/x-www-form-urlencoded',
    muteHttpExceptions: true,
    payload : {
      qLoginName: id,
      qPasswd: password,
      qActionMode: 'login'
    }
  };
  
  // ログイン
  var loginResponse = UrlFetchApp.fetch(loginUrl,loginOptions);
  
  // レスポンスヘッダーからcookie(mmsns)を取得
  var loginHeaders = loginResponse.getAllHeaders();
  var cookies;
  
  if ( typeof loginHeaders['Set-Cookie'] !== 'undefined' ) {
    // Set-Cookieヘッダーが2つ以上の場合はheaders['Set-Cookie']の中身は配列
    cookies = typeof loginHeaders['Set-Cookie'] == 'string' ? [ loginHeaders['Set-Cookie'] ] : loginHeaders['Set-Cookie'];
    
    for (var i = 0; i < cookies.length; i++) {
      // Set-Cookieヘッダーからname=valueだけ取り出し、セミコロン以降の属性は除外する
      cookies[i] = cookies[i].split( ';' )[0];
    };
  }
  
  
  //スコア一覧画面のhtml取得
  var listUrl = 'https://score.golfdigest.co.jp/score/list';
  var scoreOptions = {
    method : 'get',
    followRedirects: false,
    contentType: 'application/x-www-form-urlencoded',
    muteHttpExceptions: true,
    headers: {
      Cookie: cookies.join(';')
    }
  };
  var roundList = [];
  
  //ラウンドリスト取得&ラウンド回数を数える
  var roundNum = 0;
  for(var i = 0; true; i++){
    var listHtml = UrlFetchApp.fetch(listUrl + '?page=' + (i + 1),scoreOptions).getContentText('UTF-8');
    if(listHtml.match(/スコア一覧データがありません。/)){
      break;
    }else{
      roundList.push(getChildTags(listHtml,[
      ['table','<table class="score__all__table">','',0],['tr','<tr>','<td>']
      ]))
      roundNum += roundList[i].length;
    }
  }
  
  //行数を数える
  var rowsNum;
  for(var i = 1; true; i++){
    if(getData(i, 2) == '#'){
      rowsNum = sheetInput.getLastRow() - i;
      break;
    }
  }
  
  //少なかったら行増やす
  if(roundNum > rowsNum){
    addRows(roundNum - rowsNum);
  }
  
  
  //更新数取得
  var updateNum;
  while(true){
    var inputUpdateNum = Browser.inputBox('更新数選択','直近何回分更新しますか？(全' + roundNum + '回)',Browser.Buttons.OK_CANCEL);

    if(inputUpdateNum == 'cancel'){
      return;
    }else if(inputUpdateNum > 0 && inputUpdateNum < roundNum + 1){
      updateNum = inputUpdateNum;
      break;
    }else{
      Browser.msgBox('正しい値を入力してください(半角数字1~' + roundNum + ')',Browser.Buttons.OK);
    }
  }
  
  for(var i = updateNum - 1; i >= 0; i--){
//  for(var i = 26; i >= 0; i--){
    //スコア詳細ページ取得
    var pageNum = Math.floor(i/20);
    var roundTd = roundList[pageNum][i - (20 * pageNum)];
    var detailUrl = getTags(roundTd,'td','<td>','div')[0].match(/\/score\/detail\/[0-9]*/)[0].replace('/score','https://score.golfdigest.co.jp/score');
    var detailHtml = UrlFetchApp.fetch(detailUrl,scoreOptions).getContentText('UTF-8');
    var roundSummaryDiv = getTags(detailHtml,'div','<div class="score__detail__place__info">','')[0];
    var scoreSummaryTable = getTags(detailHtml,'table','<table class="score__done__score-[0-9]*?__table">','')[0];
    var scoreTables = getTags(detailHtml,'table','<table class="score__detail__table__[0-9]*">','');
   
    //ゴルフ場ページが無いもの判定
    var noCourseFlag = false;
    if(!roundSummaryDiv.match(/<a/)){
      noCourseFlag = true;
    }
    
    //未完了のラウンド判定(パット入力がないことで判定)
    var planFlag = false;
    if(!scoreSummaryTable.match(/score__done__score-[0-9]*?__icon-putt/)){
      planFlag = true;
    }
    
    //入力列定義
    var row = (roundNum - i) + 3;
        
    //項番入力
    setData(row,2,roundNum - i);
    
    
    //日付取得
    var dateP = getTags(roundSummaryDiv, 'p', '<p class="score__detail__place__info__date">', '')[0];
    var date　= "'";
    date += dateP.match(/[0-9]{2}年/)[0].replace('年','/');
    date += dateP.match(/[0-9]*月/)[0].replace('月','/');
    date += dateP.match(/[0-9]*日/)[0].replace('日','');
    if(planFlag){
      date = '(' + date + ')';
    }
    
    //日付入力
    setData(row,3,date);
    
    
    //ヤーデージ取得
    var yards = []; //コースマッチで使うので、それぞれの値も残す
    var yard = 0;
    for(var j = 0; j < 2; j++){
      yards.push(getChildTags(scoreTables[j],[
        ['tr','<tr class="is-yard">','',0],['td','<td>','']
      ])[9].replace(/,|y/g,''));
      
      yard += Number(yards[j]);
    }
    
    //ヤーデージ入力
    setData(row,7,yard);
    
    
    //アベレージ取得
    var Ave = '100';
    if(!noCourseFlag){
      Ave = getChildTags(scoreSummaryTable,[
        ['tr','<tr class="is-total-score">','',0],['td','<td>','']
      ])[1].replace(/\n|\r|\s/g,'');
    }else{
      sheetInput.getRange(row,8,1,1).setBackground('#ffff00');
    }
    
    //アベレージ入力
    setData(row,8,Ave);
    
    
    //PAR数取得
    var pars = [];
    for(var j = 0; j < 2; j++){
      var parTds = getChildTags(scoreTables[j],[
        ['tr','<tr class="is-par">','',0],['td','<td>','']
      ]);
      pars.push([]);
      for(var k = 0; k < 9; k++){
        pars[j].push(parTds[k]);
      }
    }
    
    //PAR数入力
    for(var j = 0; j < 2; j++){
      for(var k = 0; k < 9; k++){
        setData(row, 9 + k + (9 * j), pars[j][k]);
      }
    }
    
    
    //スコア取得
    var scores = [];
    for(var j = 0; j < 2; j++){
      var scoreTds = getChildTags(scoreTables[j],[
        ['tr','<tr class="is-myscore">','',0],['td','<td>','']
      ]);
      scores.push([]);
      for(var k = 0; k < 9; k++){
        scores[j].push(scoreTds[k]);
      }
    }
    
    //スコア入力
    if(!planFlag){
      for(var j = 0; j < 2; j++){
        for(var k = 0; k < 9; k++){
          setData(row, 27 + k + (9 * j), scores[j][k]);
        }
      }
    }
    
    
    //パット数取得
    var putts = [];
    for(var j = 0; j < 2; j++){
      var puttTds = getChildTags(scoreTables[j],[
        ['tr','<tr class="is-putt">','',0],['td','<td>','']
      ]);
      putts.push([]);
      for(var k = 0; k < 9; k++){
        putts[j].push(puttTds[k]);
      }
    }
    
    //パット数入力
    if(!planFlag){
      for(var j = 0; j < 2; j++){
        for(var k = 0; k < 9; k++){
          setData(row, 63 + k + (9 * j), putts[j][k]);
        }
      }
    }
    
    
    //コースページ取得
    if(!noCourseFlag){
      var courseUrl = roundSummaryDiv.match(/https:\/\/reserve.golfdigest.co.jp\/golf-course\/detail\/[0-9]+/)[0];
      var courseHtml = UrlFetchApp.fetch(courseUrl,scoreOptions).getContentText('UTF-8');
      var layoutUrl = 'https://reserve.golfdigest.co.jp/golf-course/course-layout/' + courseUrl.match(/[0-9]+/)[0];
      var layoutHtml = UrlFetchApp.fetch(layoutUrl,scoreOptions).getContentText('UTF-8');
      var courseSummaryTable = getTags(courseHtml,'table','<table summary="コース概要".*?>','')[0];
    }
    
    //ゴルフ場名取得
    var courseName = getChildTags(detailHtml,[
      ['li','<li class="score__breadcrumb__list__item">','',3],['span','<span class="score__breadcrumb__list__item__no-link">','']
    ])[0].split(' ')[1].replace(/カントリー(クラブ|倶楽部)/,'CC').replace(/ゴルフ(クラブ|倶楽部)/,'GC');
    
    //コース名追加
    var subCourseNames = [];
    if(!noCourseFlag){
      var subCourseNum = getChildTags(layoutHtml,[
      ['div','<div id="couse_layout">','',0],['table','<table.*?>','']
      ]).length;
      
      if(subCourseNum > 2){
        var subCourseTrs = getTags(scoreSummaryTable,'tr','<tr class="is-hole">','');
        subCourseTrs.forEach(function(value,index){
          subCourseNames.push(getTags(value,'span','<span.*?>','')[0]);
          if(index == 0){
            courseName += '[';
          }else{
            courseName += '・';
          }
          courseName += subCourseNames[index];
        });
        courseName += ']';
      }
    }
    
    
    //ゴルフ場名入力
    setData(row,4,courseName);
    
    
    //コースタイプ取得
    var courseType;
    if(!noCourseFlag){
    courseType = getChildTags(courseSummaryTable,[
      ['tr','<tr>','コースタイプ',0],['td','<td>','']
      ])[0].replace(/\n|\r/g,'');
    }else{
      courseType = '？？';
    }
    
    //コースタイプ入力
    setData(row,5,courseType);
    
    
    //コースレート取得
    var courseRate = '？？';
    var excepNum = false;
    var noCourseRateFlag = false;
    var greenMatchIndex = [];
    var subCourseMatchIndex = [];
    var green = getTags(roundSummaryDiv,'li','<li class="score__detail__place__info__list__item is-green">','')[0].replace('... ','');
    if(!noCourseFlag){
      var courseRatesTd = getChildTags(courseSummaryTable,[
        ['tr','<tr>','コースレート',0],['td','<td>','']
      ])[0];
      
      if(courseRatesTd.match(/[0-9]/)){
        var courseRates = courseRatesTd.split('<br />');
        if(courseRates.length == 1){
          courseRate = courseRates[0].match(/[0-9]+\.[0-9]+/)[0];
        }else if(courseRates.length > 1){
          courseRates.forEach(function(value,index){
            if(value.match(new RegExp(green))){
              greenMatchIndex.push(index);
            }
          });
          if(greenMatchIndex.length == 1){
            courseRate = courseRates[greenMatchIndex[0]].match(/[0-9]+\.[0-9]+/)[0];
          }else if(greenMatchIndex.length > 1){
            greenMatchIndex.forEach(function(value){
              if(subCourseNames.length == 2){
                if(courseRates[value].match(new RegExp(subCourseNames[0])) && courseRates[value].match(new RegExp(subCourseNames[1]))){
                  subCourseMatchIndex.push(value);
                }
              }
            });
            if(subCourseMatchIndex.length == 1){
              courseRate = courseRates[subCourseMatchIndex[0]].match(/[0-9]+\.[0-9]+/)[0];
            }else if(subCourseMatchIndex.length > 1){
              excepNum = 0;
            }else{
              excepNum = 1;
            }
          }else{
            excepNum = 2;
          }
        }
      }else{
        courseRate = '70';
        noCourseRateFlag = true;
      }
    }else{
      courseRate = '70';
      noCourseRateFlag = true;
    }
    
    //例外系(マッチが0個になるとか)
    if(excepNum){
      var matchIndex = [];
      switch(excepNum){
        case 0:
          matchIndex = subCourseMatchIndex;
          break;
        case 1:
          matchIndex = greenMatchIndex;
          break;
        case 2:
          courseRate.forEach(function(value,index){
            matchIndex.push(index);
          });
          break;
      }
      
      var popText = '候補が複数あります。正しいものの番号を選択してください。\\n\\n'
      matchIndex.forEach(function(value,index){
        popText += (index + 1) + '. ' + courseRates[value] + '\\n'
        if(index == matchIndex.length - 1){
          popText += (index + 2) + '. この中には無い'
        }
      });
      while(true){
        var inputCourseRate = Browser.inputBox(courseName + 'のコースレート',popText,Browser.Buttons.OK);
        if(inputCourseRate > 0 && inputCourseRate < matchIndex.length + 2){
          if(inputCourseRate != matchIndex.length + 1){
            courseRate = courseRates[matchIndex[inputCourseRate - 1]].match(/[0-9]+\.[0-9]+/)[0];
          }else{
            courseRate = '70'
            noCourseRateFlag = true;
          }
          break;
        }else{
          Browser.msgBox('正しい値を入力してください(半角数字1~' + (matchIndex.length + 1) + ')',Browser.Buttons.OK);
        }
      }
    }
    
    //コースレート入力
    setData(row,6,courseRate);
    if(noCourseRateFlag){
      sheetInput.getRange(row,6,1,1).setBackground('#ffff00');
    }
    
    
    //HDCP取得
    var HDCPs = [[],[]];
    if(!noCourseFlag){
      var courseSummaryTables = getTags(layoutHtml, 'table', '<table.*?class="tbl layout.*?>','');
      
      courseSummaryTables.forEach(function(value,index){
        var coursePars = [];
        var courseHDCPs = []; 
        var courseYards = []; 
        
        var courseSummaryTrs = getChildTags(value,[
          ['tbody', '<tbody>','',0],['tr', '<tr>','']
        ]);
        
        for(var j = 0; j < 9; j++){
          coursePars.push(getTags(courseSummaryTrs[0], 'td', '<td>', '')[j].match(/[0-9]/)[0]);
          courseHDCPs.push(getTags(courseSummaryTrs[courseSummaryTrs.length - 1], 'td', '<td>', '')[j]);
        }
        
        for(var j = 1; j < courseSummaryTrs.length - 1; j++){
          courseYards.push(getTags(courseSummaryTrs[j], 'td', '<td>', '')[9]);
        }
        
        for(var j = 0; j < 2; j++){
          var yardReg = new RegExp(yards[j]);
          if(String(coursePars) == String(pars[j]) && String(courseYards).match(yardReg)){
            HDCPs[j] = courseHDCPs;
          }
        }
      });
      
      //HDCP入力
      for(var j = 0; j < 2; j++){
        for(var k = 0; k < 9; k++){
          setData(row, 99 + k + (9 * j), HDCPs[j][k]);
        }
      }
    }
    
    
  }
}


function getData(y,x){
  var range = sheetInput.getRange(y, x);
  return range.getValue();
}


function setData(y,x,data){
  var range = sheetInput.getRange(y, x);
  range.setValue(data);
}

//tagType:'div'とか, tagReg:開始タグの正規表現, elementReg:中に含まれる要素の正規表現
function getTags(xml,tagType,tagReg,elementReg){
  var indexStartTag;
  var xmls = [];
  tagReg = new RegExp(tagReg);
  elementReg = new RegExp(elementReg);
  
  for (var i = 0;true;i++){
    indexStartTag = xml.search(tagReg);
    if(indexStartTag !== -1){
      xml = xml.substring(indexStartTag + xml.match(tagReg)[0].length);
      var copyXml = xml;
      var index = 0;
      var endTagNum = 0; //開始タグに対する終了タグの数。これが1になったら親要素の終了タグとみなす
      var reg = new RegExp('<(/)?' + tagType);
      
      while(endTagNum < 1){
        index += copyXml.search(reg) + 1;
        if(copyXml.match(reg)[0] == '<' + tagType){
          endTagNum --;
        }else{
          endTagNum ++;
        }
        copyXml = xml.substring(index)
      }
      
      if(xml.substring(0,index - 1).search(elementReg) !== -1){
        xmls.push(xml.substring(0,(index - 1)));
      }
      xml = xml.substring((index - 1) + (tagType.length + 3));
    }else{
      break;
    }
  }
  return xmls;
}

function getChildTags(xml,array){ //array = [[tagType,tagReg,elementReg,num],[tagType,tagReg,elementReg],・・・・・]
  array.forEach(function(value,index){
    xml = getTags(xml,value[0],value[1],value[2]);
    if(index !== array.length - 1){
      xml = xml[value[3]];
    }
  });
  return xml;
}

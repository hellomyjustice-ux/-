/**
 * 학생 게시판 - Google Apps Script
 *
 * [배포 방법]
 * 1. Apps Script 에디터 우측 상단 [배포] → [새 배포]
 * 2. 유형: 웹 앱
 * 3. 다음 사용자로 실행: 나
 * 4. 액세스 권한: 모든 사용자 (Anyone)
 * 5. 배포 후 생성된 URL을 script.js의 GAS_URL에 붙여넣기
 */

// 데이터를 저장할 시트 이름
const SHEET_NAME = 'posts';

/**
 * 시트를 가져오는 함수.
 * 시트가 없으면 자동으로 생성하고 헤더 행을 추가한다.
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // 시트가 없으면 새로 만들고 헤더 설정
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);

    // 1행: 헤더
    sheet.appendRow(['번호', '제목', '이름', '내용', '작성일시']);
    sheet.setFrozenRows(1); // 헤더 행 고정

    // 헤더 스타일 (보라색 배경)
    sheet.getRange('A1:E1')
      .setFontWeight('bold')
      .setBackground('#6d28d9')
      .setFontColor('#ffffff')
      .setHorizontalAlignment('center');

    // 열 너비 설정
    sheet.setColumnWidth(1, 60);   // 번호
    sheet.setColumnWidth(2, 200);  // 제목
    sheet.setColumnWidth(3, 100);  // 이름
    sheet.setColumnWidth(4, 360);  // 내용
    sheet.setColumnWidth(5, 180);  // 작성일시
  }

  return sheet;
}

/**
 * doPost: 외부(게시판)에서 POST 요청이 들어올 때 실행되는 함수.
 *
 * 요청 body (JSON):
 *   { action: 'add', title: '제목', name: '이름', content: '내용' }
 *   { action: 'delete', id: '행번호' }
 *
 * 응답 (JSON):
 *   성공 → { success: true }
 *   실패 → { success: false, error: '오류 메시지' }
 */
function doPost(e) {
  try {
    // 요청 body를 JSON으로 파싱
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    // ── 글 추가 ──────────────────────────────────────────
    if (body.action === 'add') {
      // 필수 필드 검증
      if (!body.title || !body.name || !body.content) {
        return buildResponse({ success: false, error: '제목, 이름, 내용은 필수입니다.' });
      }

      // 현재 데이터 행 수로 번호 계산 (헤더 제외)
      const lastRow = sheet.getLastRow();
      const rowNum  = lastRow; // 헤더가 1행이므로 lastRow = 현재 게시글 수

      // 스프레드시트에 새 행 추가
      sheet.appendRow([
        rowNum,                          // 번호 (자동 증가)
        body.title,                      // 제목
        body.name,                       // 이름
        body.content,                    // 내용
        new Date().toLocaleString('ko-KR'), // 작성일시 (한국 시간)
      ]);

      return buildResponse({ success: true });
    }

    // ── 글 삭제 ──────────────────────────────────────────
    if (body.action === 'delete') {
      const rows = sheet.getDataRange().getValues();

      // 뒤에서부터 탐색해 id가 일치하는 행 삭제 (행 번호 어긋남 방지)
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]) === String(body.id)) {
          sheet.deleteRow(i + 1); // 시트 행은 1-indexed
          return buildResponse({ success: true });
        }
      }

      return buildResponse({ success: false, error: '해당 게시글을 찾을 수 없습니다.' });
    }

    return buildResponse({ success: false, error: '알 수 없는 action입니다.' });

  } catch (err) {
    // 예외 발생 시 오류 메시지 반환
    return buildResponse({ success: false, error: err.message });
  }
}

/**
 * doGet: GET 요청 시 전체 게시글 목록을 JSON으로 반환.
 * 게시판 페이지 로드 시 호출된다.
 */
function doGet(e) {
  try {
    const sheet = getSheet();
    const rows  = sheet.getDataRange().getValues();

    // 헤더(1행) 제외하고 게시글 배열로 변환
    const posts = rows.slice(1)
      .filter(r => r[0] !== '')       // 빈 행 제외
      .map(r => ({
        id:        String(r[0]),       // 번호
        title:     r[1],               // 제목
        name:      r[2],               // 이름
        content:   r[3],               // 내용
        createdAt: r[4],               // 작성일시
      }));

    return buildResponse({ success: true, posts });

  } catch (err) {
    return buildResponse({ success: false, error: err.message });
  }
}

/**
 * JSON 응답을 ContentService로 반환하는 헬퍼 함수.
 * MimeType을 JSON으로 설정해야 브라우저가 올바르게 파싱한다.
 */
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

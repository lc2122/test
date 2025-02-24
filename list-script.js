// HTML 이스케이프 함수 정의
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
 
// 스트림 데이터 가져오기
async function fetchStreamData() {
    try {
        const response = await fetch("https://www.dostream.com/dev/stream_list.php");
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("스트림 데이터를 가져오는 데 실패했습니다:", error);
        return [];
    }
}

// 스트림 목록 렌더링
async function ADD_run(data, flag) {
    let append = "";
    const $ul = document.querySelector("#stream-section .main-streams ul");

    data.forEach((stream) => {
        // 아프리카TV와 트위치 스트림 제외
        if (stream.from === "afreeca" || stream.from === "twitch") {
            return;
        }

        // 플랫폼별 표시 이름 설정
        let display_name = "";
        if (stream.from === "youtube") {
            display_name = "유투브";
        } else if (stream.from === "chzzk") {
            display_name = stream.display_name || stream.streamer || stream.url.split("/").pop();
        } else {
            display_name = stream.from;
        }

        // 스트림 항목 HTML 생성
        append += `
            <li class="${stream.from}">
                <a href="/#/stream${escapeHtml(stream.url)}">
                    <img src="${stream.image}" width="90" height="60">
                    <div class="stream-wrap">
                        <div class="title">${escapeHtml(stream.title)}</div>
                        <div class="info">
                            <div class="from ${stream.from}">${escapeHtml(display_name)}</div>
                            <div class="viewers">시청자: ${escapeHtml(stream.viewers)}</div>
                        </div>
                    </div>
                </a>
            </li>
        `;
    });

    // 목록 업데이트
    $ul.innerHTML = append;

    // 마지막 업데이트 시간 표시
    const updateTime = new Date().toLocaleString();
    const $updateTimeDiv = document.createElement("div");
    $updateTimeDiv.className = "last_list_update_time";
    $updateTimeDiv.style.fontSize = "11px";
    $updateTimeDiv.style.color = "#999";
    $updateTimeDiv.style.clear = "both";
    $updateTimeDiv.style.padding = "5px 0";
    $updateTimeDiv.style.textAlign = "right";
    $updateTimeDiv.textContent = `마지막 업데이트: ${updateTime}`;
    document.querySelector(".main-streams").appendChild($updateTimeDiv);
}

// 페이지 로드 및 이벤트 설정
document.addEventListener("DOMContentLoaded", async () => {
    const refreshBtn = document.getElementById("refresh-list-btn");
    const backBtn = document.getElementById("back-btn");

    // 새로고침 버튼 클릭 시 데이터 다시 가져오고 렌더링
    refreshBtn.addEventListener("click", async () => {
        const data = await fetchStreamData();
        ADD_run(data, 0);
    });

    // 메인으로 버튼 클릭 시 index.html로 이동
    backBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });

    // 초기 로드
    const data = await fetchStreamData();
    ADD_run(data, 0);
});

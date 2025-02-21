const CHANNELS = {
    youtube: {
        id: 'UCw1DsweY9b2AKGjV4kGJP1A',
        buttonLabel: '숙제1',
        color: '#FF0000',
        url: (id) => `https://www.youtube.com/embed/live_stream?channel=${id}`
    },
    forest: {
        buttonLabel: '숙제2',
        color: '#00aaff',
        url: () => 'https://play.sooplive.co.kr/aflol/281494910/embed'
    },
    flow: {
        buttonLabel: 'flow',
        color: '#00FFA3',
        url: () => 'https://insagirl.github.io/syncwatchdemo/syncwatch2.html'
    }
};

const videoSection = document.getElementById('video-section');
const videoIframe = document.getElementById('video-iframe');
const youtubeBtn = document.getElementById('youtube-btn');
const forestBtn = document.getElementById('forest-btn');
const flowBtn = document.getElementById('flow-btn');
const inputBtn = document.getElementById('input-btn');
const goBtn = document.getElementById('go-btn');
const closeBtn = document.getElementById('close-btn');
const inputModal = document.getElementById('input-modal');
const multiviewCheckbox = document.getElementById('multiview-checkbox');
const singleUrlInputContainer = document.getElementById('single-url-input-container');
const urlInput = document.getElementById('url-input');
const multiviewOptions = document.getElementById('multiview-options');
const multiviewLayoutSelect = document.getElementById('multiview-layout-select');
const multiviewUrlInputs = document.getElementById('multiview-url-inputs');

// 멀티뷰 관련 상태 관리
let currentMultiviewLayout = 1;
let multiviewUrlInputCounter = 0;

// YouTube 버튼
youtubeBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.youtube.url(CHANNELS.youtube.id));
});

// 숲 버튼
forestBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.forest.url());
});

// flow 버튼
flowBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.flow.url());
});

// "Input" 버튼 클릭 시
inputBtn.addEventListener('click', () => {
    inputModal.style.display = 'block';
    // 모달 열 때 단일 뷰 모드로 설정
    multiviewCheckbox.checked = false;
    showSingleInput();
});

// 멀티뷰 체크박스 변경 시
multiviewCheckbox.addEventListener('change', () => {
    if (multiviewCheckbox.checked) {
        showMultiviewOptions();
    } else {
        showSingleInput();
    }
});

// 멀티뷰 레이아웃 선택 변경 시
multiviewLayoutSelect.addEventListener('change', () => {
    currentMultiviewLayout = parseInt(multiviewLayoutSelect.value);
    updateMultiviewUrlInputs();
});

// "Go" 버튼 클릭 시
goBtn.addEventListener('click', () => {
    if (multiviewCheckbox.checked) {
        startMultiview();
    } else {
        startSingleView();
    }
    inputModal.style.display = 'none';
});

// "X" 버튼 클릭 시 입력창 닫기
closeBtn.addEventListener('click', () => {
    inputModal.style.display = 'none';
});

// 멀티뷰 관련 함수
function showSingleInput() {
    singleUrlInputContainer.style.display = 'block';
    multiviewOptions.style.display = 'none';
    urlInput.value = '';
}

function showMultiviewOptions() {
    singleUrlInputContainer.style.display = 'none';
    multiviewOptions.style.display = 'block';
    // 멀티뷰 옵션 표시될 때 입력 필드 초기화 및 생성
    multiviewUrlInputs.innerHTML = '';
    multiviewUrlInputCounter = 0;
    for (let i = 0; i < currentMultiviewLayout; i++) {
        addMultiviewInput();
    }
}

function updateMultiviewUrlInputs() {
    const currentInputs = multiviewUrlInputs.querySelectorAll('.multiview-input');
    const diff = currentMultiviewLayout - currentInputs.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) {
            addMultiviewInput();
        }
    } else if (diff < 0) {
        for (let i = 0; i < -diff; i++) {
            if (multiviewUrlInputs.lastChild) {
                multiviewUrlInputs.removeChild(multiviewUrlInputs.lastChild);
                multiviewUrlInputCounter--;
            }
        }
    }
}

function addMultiviewInput() {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'multiview-input';
    input.placeholder = `URL ${multiviewUrlInputCounter + 1}`;
    multiviewUrlInputs.appendChild(input);
    multiviewUrlInputCounter++;
}

function startSingleView() {
    const url = urlInput.value.trim();
    setSingleViewContent(url);
}

function setSingleViewContent(url) {
    const transformedUrl = transformUrl(url);
    if (transformedUrl) {
        if (transformedUrl.endsWith('.m3u8')) {
            videoIframe.src = getPlayerUrl(transformedUrl);
        } else {
            videoIframe.src = transformedUrl;
        }
    }
}

function startMultiview() {
    const inputs = multiviewUrlInputs.querySelectorAll('.multiview-input');
    const urls = Array.from(inputs).map(input => {
        const transformed = transformUrl(input.value.trim());
        return transformed.endsWith('.m3u8') ? getPlayerUrl(transformed) : transformed;
    });

    // 1분할 예외 처리
    if (currentMultiviewLayout === 1) {
        multiviewCheckbox.checked = false;
        showSingleInput();
        startSingleView();
        return;
    }

    // 멀티뷰 컨테이너 생성
    videoSection.innerHTML = `
        <div class="multiview-container" 
             style="grid-template-columns: repeat(${getMultiviewColumns(currentMultiviewLayout)}, 1fr);">
            ${urls.map(url => `
                <div class="multiview-item">
                    <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
                </div>
            `).join('')}
        </div>
    `;

    // 멀티뷰 모드에서 버튼에 대한 이벤트 리스너를 새로 등록
    const multiviewContainer = videoSection.querySelector('.multiview-container');
    multiviewContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'IFRAME') {
            const iframe = e.target;
            const url = iframe.src;
            // 버튼 클릭 시의 동작을 여기에 구현
            if (url.includes('youtube')) {
                // youtube 버튼 클릭 시의 동작
            } else if (url.includes('twitch')) {
                // twitch 버튼 클릭 시의 동작
            } else if (url.includes('chzzk')) {
                // chzzk 버튼 클릭 시의 동작
            } else if (url.includes('kick')) {
                // kick 버튼 클릭 시의 동작
            } else if (url.includes('afreeca')) {
                // afreeca 버튼 클릭 시의 동작
            }
        }
    });

    // 멀티뷰 모드에서 iframe 크기 조정
    const multiviewItems = videoSection.querySelectorAll('.multiview-item');
    multiviewItems.forEach(item => {
        const iframe = item.querySelector('iframe');
        if (iframe) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
        }
    });
}
function getMultiviewColumns(layout) {
    return layout > 2 ? 2 : layout;
}

function getPlayerUrl(m3u8Url) {
    const ua = navigator.userAgent;
    if (/Chrome/i.test(ua) && !/Whale/i.test(ua) && !/Edg/i.test(ua)) {
        return `chrome-extension://eakdijdofmnclopcffkkgmndadhbjgka/player.html#${m3u8Url}`;
    } else {
        return `https://www.livereacting.com/tools/hls-player-embed?url=${encodeURIComponent(m3u8Url)}`;
    }
}

// 즐겨찾기 목록을 저장할 배열
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// 즐겨찾기 목록 표시 함수
function renderFavorites() {
    const favoriteModal = document.getElementById('favorite-modal');
    const favoriteList = document.getElementById('favorite-list');

    // 기존 목록 초기화
    favoriteList.innerHTML = '';

    // 즐겨찾기 목록을 동적으로 추가
    favorites.forEach((favorite, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${favorite.name}</span>
            <button onclick="deleteFavorite(${index})">삭제</button>
        `;
// 즐겨찾기 클릭 핸들러
li.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') {
        multiviewCheckbox.checked = false;
        showSingleInput();
        const transformedUrl = transformUrl(favorite.url);
        if (transformedUrl) {
            videoIframe.src = transformedUrl.endsWith('.m3u8') 
                ? getPlayerUrl(transformedUrl) 
                : transformedUrl;
            favoriteModal.style.display = 'none';
        }
    }
});
        favoriteList.appendChild(li);
    });

    // 모달 표시
    favoriteModal.style.display = 'block';
}

// '즐찾' 버튼 클릭 시 즐겨찾기 목록 표시
const favoriteBtn = document.getElementById('favorite-btn');
favoriteBtn.addEventListener('click', () => {
    renderFavorites();
});

// '닫기' 버튼 클릭 시 모달 닫기
const closeFavoriteModal = document.getElementById('close-favorite-modal');
closeFavoriteModal.addEventListener('click', () => {
    document.getElementById('favorite-modal').style.display = 'none';
});

// 즐겨찾기 추가 함수
function addFavorite(url, name) {
    if (!url || !name) {
        alert('URL과 이름을 입력해주세요.');
        return;
    }

    // 중복 체크
    if (favorites.some(fav => fav.url === url)) {
        alert('이미 등록된 URL입니다.');
        return;
    }

    // 즐겨찾기에 추가
    favorites.push({ url, name });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert('즐겨찾기에 추가되었습니다.');

    // 목록 새로고침
    renderFavorites();

    // 입력 필드 초기화
    document.getElementById('favorite-name-input').value = '';
    document.getElementById('favorite-url-input').value = '';
}

// 즐겨찾기 삭제 함수
function deleteFavorite(index) {
    if (confirm('정말로 삭제하시겠습니까?')) {
        favorites.splice(index, 1); // 해당 항목 삭제
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites(); // 목록 새로고침
    }
}

// '추가' 버튼 클릭 시 즐겨찾기 추가
const addFavoriteBtn = document.getElementById('add-favorite-btn');
addFavoriteBtn.addEventListener('click', () => {
    const url = document.getElementById('favorite-url-input').value.trim();
    const name = document.getElementById('favorite-name-input').value.trim();
    addFavorite(url, name);
});

// URL 변환 함수 (기존과 동일)
function transformUrl(url) {
    if (!url) return null;
    const isShortForm = /^(youtube|twitch|chzzk|kick|afreeca)\/[^\/]+$/.test(url);
    if (url === 'https://play.sooplive.co.kr/aflol/281494910/embed') {
        return url; // 숙제2 URL은 그대로 반환
    }
    if (isShortForm) {
        const [platform, channelId] = url.split('/');
        switch (platform) {
            case 'youtube': return `https://www.youtube.com/embed/${channelId}`;
            case 'twitch': return `https://player.twitch.tv/?channel=${channelId}&parent=lc2122.github.io`;
            case 'chzzk': return `https://chzzk.naver.com/live/${channelId}`;
            case 'kick': return `https://player.kick.com/${channelId}`;
            case 'afreeca': return `https://play.sooplive.co.kr/${channelId}/embed`;
            default: alert('지원하지 않는 플랫폼입니다.'); return null;
        }
    }
    if (!url.startsWith('http')) { alert('유효한 URL을 입력해주세요.'); return null; }
    if (url.endsWith('.m3u8')) return url;
    if (url.startsWith('https://lolcast.kr/#/player/youtube/')) return `https://www.youtube.com/embed/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/twitch/')) return `https://player.twitch.tv/?channel=${url.split('/').pop()}&parent=lc2122.github.io`;
    if (url.startsWith('https://lolcast.kr/#/player/chzzk/')) return `https://chzzk.naver.com/live/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/kick/')) return `https://player.kick.com/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/afreeca/')) return `https://play.sooplive.co.kr/${url.split('/').pop()}/embed`;
    if (url.includes('youtu.be') || url.includes('youtube.com/watch?v=')) { const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/); if (match) return `https://www.youtube.com/embed/${match[1]}`; }
    if (url.startsWith('https://twitch.tv/')) return `https://player.twitch.tv/?channel=${url.split('/').pop()}&parent=lc2122.github.io`;
    if (url.startsWith('https://chzzk.naver.com/live/') || url.startsWith('https://chzzk.naver.com/')) return `https://chzzk.naver.com/live/${url.split('/').pop()}`;
    if (url.startsWith('https://kick.com/')) return `https://player.kick.com/${url.split('/').pop()}`;
 if (url.startsWith('https://play.sooplive.co.kr/')) return `https://play.sooplive.co.kr/${url.split('/')[3]}/embed`; // 수정: 세 번째 segment 사용
    if (url.startsWith('https://')) return url;
    alert('지원하지 않는 URL 형식입니다.'); return null;
}

// 초기 로드 및 해시 처리 (기존과 거의 동일)
window.addEventListener('load', () => {
    videoIframe.src = CHANNELS.flow.url();
    const hash = window.location.hash;
    if (hash.startsWith('#/twitch/')) setSingleViewContent(`https://player.twitch.tv/?channel=${hash.split('/')[2]}&parent=lc2122.github.io`);
    else if (hash.startsWith('#/youtube/')) setSingleViewContent(`https://www.youtube.com/embed/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/chzzk/')) setSingleViewContent(`https://chzzk.naver.com/live/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/soop/')) setSingleViewContent(`https://play.sooplive.co.kr/${hash.split('/')[2]}/embed`);
    else if (hash.startsWith('#/kick/')) setSingleViewContent(`https://player.kick.com/${hash.split('/')[2]}`);
});

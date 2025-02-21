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

// 드래그 앤 드롭 이벤트 핸들러
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.url);
    e.dataTransfer.effectAllowed = 'move';
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.target.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.target.classList.remove('drag-over');
    const url = e.dataTransfer.getData('text/plain');
    e.target.value = url;
}

// 드래그 앤 드롭 이벤트 연결
function setupDragAndDrop() {
    const inputs = document.querySelectorAll('.multiview-input');
    inputs.forEach(input => {
        input.addEventListener('dragover', handleDragOver);
        input.addEventListener('dragleave', handleDragLeave);
        input.addEventListener('drop', handleDrop);
    });

    const favoriteItems = document.querySelectorAll('#multiview-favorite-list li');
    favoriteItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// 즐겨찾기 렌더링 함수
function renderFavorites(containerId = 'favorite-list') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    favorites.forEach((favorite, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.url = favorite.url;
        li.innerHTML = `
            <span>${favorite.name}</span>
            ${containerId === 'favorite-list' ? `<button onclick="deleteFavorite(${index})">삭제</button>` : ''}
        `;
        container.appendChild(li);
    });

    if (containerId === 'multiview-favorite-list') {
        setupDragAndDrop();
    }
}

// 즐겨찾기 추가 함수
function addFavorite(url, name) {
    if (!url || !name) {
        alert('URL과 이름을 입력해주세요.');
        return;
    }

    if (favorites.some(fav => fav.url === url)) {
        alert('이미 등록된 URL입니다.');
        return;
    }

    favorites.push({ url, name });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    alert('즐겨찾기에 추가되었습니다.');
    renderFavorites();
    document.getElementById('favorite-name-input').value = '';
    document.getElementById('favorite-url-input').value = '';
}

// 즐겨찾기 삭제 함수
function deleteFavorite(index) {
    if (confirm('정말로 삭제하시겠습니까?')) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

// URL 변환 함수
function transformUrl(url) {
    if (!url) return null;
    const isShortForm = /^(youtube|twitch|chzzk|kick|afreeca)\/[^\/]+$/.test(url);
    if (url === 'https://play.sooplive.co.kr/aflol/281494910/embed') {
        return url;
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
    if (url.startsWith('https://play.sooplive.co.kr/')) return `https://play.sooplive.co.kr/${url.split('/')[3]}/embed`;
    if (url.startsWith('https://')) return url;
    alert('지원하지 않는 URL 형식입니다.'); return null;
}

// 초기 로드 및 해시 처리
window.addEventListener('load', () => {
    videoIframe.src = CHANNELS.flow.url();
    const hash = window.location.hash;
    if (hash.startsWith('#/twitch/')) setSingleViewContent(`https://player.twitch.tv/?channel=${hash.split('/')[2]}&parent=lc2122.github.io`);
    else if (hash.startsWith('#/youtube/')) setSingleViewContent(`https://www.youtube.com/embed/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/chzzk/')) setSingleViewContent(`https://chzzk.naver.com/live/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/soop/')) setSingleViewContent(`https://play.sooplive.co.kr/${hash.split('/')[2]}/embed`);
    else if (hash.startsWith('#/kick/')) setSingleViewContent(`https://player.kick.com/${hash.split('/')[2]}`);
});

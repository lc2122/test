/* CHANNELS 객체 및 기본 DOM 요소 선택 */
const CHANNELS = {
    youtube: {
        id: 'UCw1DsweY9b2AKGjV4kGJP1A',
        buttonLabel: '숙제1',
        color: '#FF0000',
        url: (id) => `https://www.youtube.com/embed/live_stream?channel=${id}`
    },
    spo: {
        buttonLabel: '스포',
        color: '#00aaff',
        url: () => 'https://lc2122.github.io/lolcast/hls.html'
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
const spoBtn = document.getElementById('spo-btn');
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
const favoriteDragContainer = document.getElementById('favorite-drag-container');
const favoriteDragList = document.getElementById('favorite-drag-list');
const listBtn = document.getElementById('list-btn');
const listModal = document.getElementById('list-modal');
const listContent = document.getElementById('list-content');
const closeListModal = document.getElementById('close-list-modal');

// 멀티뷰 관련 상태 관리
let currentMultiviewLayout = 1;
let multiviewUrlInputCounter = 0;

// 즐겨찾기 데이터
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

/* Dostream 스트리밍 리스트 가져오기 */
async function fetchStreamList() {
    const apiUrl = 'https://www.dostream.com/dev/stream_list.php';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API 오류: ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Dostream API Error:', error);
        return [];
    }
}

/* SPOTV M3U8 채널 상태 체크 (1~40) */
async function fetchM3U8LiveStatus() {
    const liveChannelIds = [];
    for (let videoNumber = 1; videoNumber <= 40; videoNumber++) {
        const m3u8Url = `https://ch${videoNumber}-nlivecdn.spotvnow.co.kr/ch${videoNumber}/decr/medialist_14173921312004482655_hls.m3u8`;
        try {
            const response = await fetch(m3u8Url, { method: 'HEAD' }); // HEAD 요청으로 상태 확인
            const isLive = response.ok && response.status === 200;
            console.log(`SPOTV Channel ${videoNumber} isLive:`, isLive);

            if (isLive) {
                liveChannelIds.push({
                    channelId: `ch${videoNumber}`,
                    channelName: `SPOTV Channel ${videoNumber}`,
                    channelImageUrl: null,
                    openLive: true,
                    liveTitle: `SPOTV Live Channel ${videoNumber}`,
                    viewers: 0, // 시청자 수는 알 수 없으므로 0으로 설정
                    url: m3u8Url,
                    from: 'm3u8'
                });
            }
        } catch (e) {
            console.error(`Error checking SPOTV Channel ${videoNumber}:`, e);
        }
    }
    return liveChannelIds;
}

/* 스트리밍 리스트 렌더링 (Dostream + SPOTV M3U8) */
async function renderStreamList() {
    const dostreamStreams = await fetchStreamList();
    const m3u8Streams = await fetchM3U8LiveStatus();
    const streams = [...dostreamStreams, ...m3u8Streams]; // 두 리스트 합침

    listContent.innerHTML = '';
    if (streams.length === 0) {
        listContent.innerHTML = '<p>현재 스트리밍 데이터가 없습니다.</p>';
    } else {
        streams.forEach(stream => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <span>${stream.title || stream.liveTitle} (${stream.from}) - ${stream.streamer || stream.channelName} [${stream.viewers}명 시청]</span>
            `;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                let url;
                switch (stream.from) {
                    case 'chzzk':
                        url = `https://chzzk.naver.com/live${stream.url.split('/chzzk')[1]}`;
                        break;
                    case 'twitch':
                        url = `https://player.twitch.tv/?channel=${stream.streamer}&parent=lc2122.github.io`;
                        break;
                    case 'afreeca':
                        url = `https://play.sooplive.co.kr${stream.url.split('/afreeca')[1]}/embed`;
                        break;
                    case 'm3u8':
                        url = stream.url; // M3U8 URL 직접 사용
                        break;
                    default:
                        url = stream.url;
                }
                setSingleViewContent(url);
                listModal.style.display = 'none';
            });
            listContent.appendChild(item);
        });
    }
    listModal.style.display = 'block';
}

/* 드래그 앤 드롭 관련 함수 */
function updateFavoriteDragContainer() {
    favoriteDragList.innerHTML = '';
    favorites.forEach((fav, index) => {
        const favItem = document.createElement('div');
        favItem.className = 'favorite-drag-item';
        favItem.textContent = fav.name;
        favItem.setAttribute('draggable', 'true');
        favItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', fav.url);
        });
        favoriteDragList.appendChild(favItem);
    });
}

function addDragDropEvents(input) {
    input.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    input.addEventListener('drop', (e) => {
        e.preventDefault();
        const droppedUrl = e.dataTransfer.getData('text/plain');
        if (droppedUrl) input.value = droppedUrl;
    });
}

/* 이벤트 리스너 */
youtubeBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.youtube.url(CHANNELS.youtube.id));
});

spoBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.spo.url());
});

flowBtn.addEventListener('click', () => {
    multiviewCheckbox.checked = false;
    showSingleInput();
    setSingleViewContent(CHANNELS.flow.url());
});

inputBtn.addEventListener('click', () => {
    inputModal.style.display = 'block';
    multiviewCheckbox.checked = false;
    showSingleInput();
});

listBtn.addEventListener('click', () => {
    renderStreamList();
});

closeListModal.addEventListener('click', () => {
    listModal.style.display = 'none';
});

multiviewCheckbox.addEventListener('change', () => {
    if (multiviewCheckbox.checked) showMultiviewOptions();
    else showSingleInput();
});

multiviewLayoutSelect.addEventListener('change', () => {
    currentMultiviewLayout = parseInt(multiviewLayoutSelect.value);
    updateMultiviewUrlInputs();
});

goBtn.addEventListener('click', () => {
    if (multiviewCheckbox.checked) startMultiview();
    else startSingleView();
    inputModal.style.display = 'none';
});

closeBtn.addEventListener('click', () => {
    inputModal.style.display = 'none';
});

/* 멀티뷰 및 단일뷰 관련 함수 */
function showSingleInput() {
    singleUrlInputContainer.style.display = 'block';
    multiviewOptions.style.display = 'none';
    urlInput.value = '';
}

function showMultiviewOptions() {
    singleUrlInputContainer.style.display = 'none';
    multiviewOptions.style.display = 'block';
    multiviewUrlInputs.innerHTML = '';
    multiviewUrlInputCounter = 0;
    for (let i = 0; i < currentMultiviewLayout; i++) {
        addMultiviewInput();
    }
    updateFavoriteDragContainer();
}

function updateMultiviewUrlInputs() {
    const currentInputs = multiviewUrlInputs.querySelectorAll('.multiview-input');
    const diff = currentMultiviewLayout - currentInputs.length;
    if (diff > 0) {
        for (let i = 0; i < diff; i++) addMultiviewInput();
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
    addDragDropEvents(input);
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
        const urlWithoutQuery = transformedUrl.split('?')[0];
        if (urlWithoutQuery.endsWith('.m3u8')) {
            videoIframe.src = getPlayerUrl(transformedUrl);
        } else {
            videoIframe.src = transformedUrl;
        }
    }
}

function startMultiview() {
    const inputs = multiviewUrlInputs.querySelectorAll('.multiview-input');
    const urls = Array.from(inputs).map(input => {
        const trimmed = input.value.trim();
        const transformed = transformUrl(trimmed);
        if (!transformed) return '';
        const urlWithoutQuery = transformed.split('?')[0];
        return urlWithoutQuery.endsWith('.m3u8') ? getPlayerUrl(transformed) : transformed;
    });

    if (currentMultiviewLayout === 1) {
        multiviewCheckbox.checked = false;
        showSingleInput();
        startSingleView();
        return;
    }

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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isChrome = /Chrome/i.test(ua);
    const isWhale = /Whale/i.test(ua);
    const isEdge = /Edg/i.test(ua);
    if (isMobile) return `https://www.livereacting.com/tools/hls-player-embed?url=${encodeURIComponent(m3u8Url)}`;
    if (isChrome || isWhale || isEdge) return `chrome-extension://eakdijdofmnclopcffkkgmndadhbjgka/player.html#${m3u8Url}`;
    return `https://www.livereacting.com/tools/hls-player-embed?url=${encodeURIComponent(m3u8Url)}`;
}

/* 즐겨찾기 모달 관련 함수 */
function renderFavorites() {
    const favoriteModal = document.getElementById('favorite-modal');
    const favoriteList = document.getElementById('favorite-list');
    favoriteList.innerHTML = '';
    favorites.forEach((favorite, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${favorite.name}</span>
            <button onclick="deleteFavorite(${index})">삭제</button>
        `;
        li.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                multiviewCheckbox.checked = false;
                showSingleInput();
                const transformedUrl = transformUrl(favorite.url);
                if (transformedUrl) {
                    videoIframe.src = transformedUrl.endsWith('.m3u8') ? getPlayerUrl(transformedUrl) : transformedUrl;
                    favoriteModal.style.display = 'none';
                }
            }
        });
        favoriteList.appendChild(li);
    });
    favoriteModal.style.display = 'block';
}

const favoriteBtn = document.getElementById('favorite-btn');
favoriteBtn.addEventListener('click', () => {
    renderFavorites();
});

const closeFavoriteModal = document.getElementById('close-favorite-modal');
closeFavoriteModal.addEventListener('click', () => {
    document.getElementById('favorite-modal').style.display = 'none';
});

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

function deleteFavorite(index) {
    if (confirm('정말로 삭제하시겠습니까?')) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

const addFavoriteBtn = document.getElementById('add-favorite-btn');
addFavoriteBtn.addEventListener('click', () => {
    const url = document.getElementById('favorite-url-input').value.trim();
    const name = document.getElementById('favorite-name-input').value.trim();
    addFavorite(url, name);
});

/* URL 변환 함수 */
function transformUrl(url) {
    if (!url) return null;
    if (url.includes('.m3u8')) return url;
    const isShortForm = /^(youtube|twitch|chzzk|kick|afreeca)\/[^\/]+$/.test(url);
    if (url === 'https://play.sooplive.co.kr/aflol/281494910/embed') return url;
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
    if (url.startsWith('https://lolcast.kr/#/player/youtube/')) return `https://www.youtube.com/embed/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/twitch/')) return `https://player.twitch.tv/?channel=${url.split('/').pop()}&parent=lc2122.github.io`;
    if (url.startsWith('https://lolcast.kr/#/player/chzzk/')) return `https://chzzk.naver.com/live/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/kick/')) return `https://player.kick.com/${url.split('/').pop()}`;
    if (url.startsWith('https://lolcast.kr/#/player/afreeca/')) return `https://play.sooplive.co.kr/${url.split('/').pop()}/embed`;
    if (url.includes('youtu.be') || url.includes('youtube.com/watch?v=')) {
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    if (url.startsWith('https://twitch.tv/')) return `https://player.twitch.tv/?channel=${url.split('/').pop()}&parent=lc2122.github.io`;
    if (url.startsWith('https://chzzk.naver.com/live/') || url.startsWith('https://chzzk.naver.com/')) return `https://chzzk.naver.com/live/${url.split('/').pop()}`;
    if (url.startsWith('https://kick.com/')) return `https://player.kick.com/${url.split('/').pop()}`;
    if (url.startsWith('https://play.sooplive.co.kr/')) return `https://play.sooplive.co.kr/${url.split('/')[3]}/embed`;
    if (url.startsWith('https://')) return url;
    alert('지원하지 않는 URL 형식입니다.'); return null;
}

/* 초기 로드 */
window.addEventListener('load', () => {
    videoIframe.src = CHANNELS.flow.url();
    const hash = window.location.hash;
    if (hash.startsWith('#/twitch/')) setSingleViewContent(`https://player.twitch.tv/?channel=${hash.split('/')[2]}&parent=lc2122.github.io`);
    else if (hash.startsWith('#/youtube/')) setSingleViewContent(`https://www.youtube.com/embed/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/chzzk/')) setSingleViewContent(`https://chzzk.naver.com/live/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/soop/')) setSingleViewContent(`https://play.sooplive.co.kr/${hash.split('/')[2]}/embed`);
    else if (hash.startsWith('#/kick/')) setSingleViewContent(`https://player.kick.com/${hash.split('/')[2]}`);
    else if (hash.startsWith('#/hls/')) {
        const m3u8Url = decodeURIComponent(hash.split('#/hls/')[1]);
        if (m3u8Url.includes('.m3u8')) setSingleViewContent(m3u8Url);
    }
});

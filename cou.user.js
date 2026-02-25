// ==UserScript==
// @name         Coupang Play M3U8 Detector & Manager
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  쿠팡플레이 index.m3u8 감지 및 스트리밍 관리자 연동
// @author       Gemini
// @match        *://*.coupangplay.com/*
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @supportURL   https://github.com/lc2122/test/
// @homepage     https://github.com/lc2122/test/
// @downloadURL  https://github.com/lc2122/test/raw/main/cou.user.js
// @updateURL    https://github.com/lc2122/test/raw/main/cou.user.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ★ 관리자 페이지(HTML)의 URL을 입력하세요.
    // 예: "http://127.0.0.1:5500/admin.html" 또는 "https://your-site.com/admin.html"
    const ADMIN_PAGE_URL = "https://lolcast.web.app/c.html";

    let detectedUrl = "";
    const btnId = 'cp-m3u8-detector';

    // 쿠팡플레이 index.m3u8 필터링 함수
    function isValidCoupangUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lowerUrl = url.toLowerCase();
        // index.m3u8로 끝나거나 포함되어야 하며, .ts(세그먼트)는 제외
        return lowerUrl.includes('index.m3u8') && !lowerUrl.includes('.ts');
    }

    function createButton() {
        let btn = document.getElementById(btnId);
        if (btn) return btn;

        btn = document.createElement('button');
        btn.id = btnId;
        btn.innerHTML = `
            <div style="font-size:12px; opacity:0.8;">쿠팡플레이 감지!</div>
            <div>관리자 페이지로 전송</div>
        `;

        btn.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; z-index: 1000000;
            padding: 12px 20px; background: #007bff; color: white;
            border: 2px solid white; border-radius: 12px; font-family: sans-serif;
            font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            display: none; transition: transform 0.2s;
        `;

        btn.onmouseover = () => btn.style.transform = "scale(1.05)";
        btn.onmouseout = () => btn.style.transform = "scale(1)";

        btn.onclick = () => {
            if (detectedUrl) {
                // 페이지 제목 가져오기 (예: "대한민국 vs 태국 | 쿠팡플레이")
                const pageTitle = document.title.split('|')[0].trim();
                // 관리자 페이지로 파라미터 전달 (source = url, name = 제목)
                const targetUrl = `${ADMIN_PAGE_URL}?source=${encodeURIComponent(detectedUrl)}&name=${encodeURIComponent(pageTitle)}`;

                GM_openInTab(targetUrl, { active: true });
                btn.style.display = 'none'; // 전송 후 숨김
            }
        };

        document.body.appendChild(btn);
        return btn;
    }

    function handleUrl(url) {
        if (isValidCoupangUrl(url)) {
            detectedUrl = url;
            const btn = createButton();
            btn.style.display = 'block';
            console.log("M3U8 Detected:", url);
        }
    }

    // 1. Fetch 인터셉트
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : "");
        handleUrl(url);
        return originalFetch.apply(this, args);
    };

    // 2. XHR 인터셉트
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        handleUrl(url);
        return originalOpen.apply(this, arguments);
    };

})();

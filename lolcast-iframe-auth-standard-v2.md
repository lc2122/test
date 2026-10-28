# lolcast iframe 게임 공통 로그인 연동 표준

- 작성일: 2026-10-28
- 기준 문서: 「타일 게임 닉네임 전달 (3번 방식, postMessage) 초안」
- 적용 범위: `tiles.html`, `public/js/tiles-screens.js`, `tiles-popout.html` 및 lolcast에서 iframe으로 실행하는 모든 등록 게임
- 프로토콜 버전: `1`

## 0. 목표

게임마다 달랐던 로그인 정보 전달 방식을 **lolcast에 등록된 모든 iframe 게임이 동일한 로그인 브릿지와 메시지 규격을 사용하는 구조**로 통일한다. 탁구를 포함해 등록된 모든 게임이 같은 요청·응답 형식을 사용한다.

공통 브릿지는 게임별 `trusted: true` 조건으로 토큰 전달 여부를 나누지 않는다. `GAMES`에 등록되어 iframe으로 실행되는 게임은 모두 동일한 인증 응답을 받는다. 따라서 앞으로 새 게임을 등록할 때도 별도의 로그인 브릿지를 구현할 필요 없이 공통 규격을 사용한다.

단, Firebase ID 토큰은 lolcast 계정의 인증 증명이다. **토큰을 받을 수 있는 게임은 lolcast 운영자가 관리하거나 인증 토큰 수신을 명시적으로 승인한 게임으로 한정**한다. 게임을 `GAMES`에 등록하는 행위는 해당 게임 오리진에 토큰을 전달하도록 승인하는 행위다. 임의의 외부 게임을 등록하면 안 된다.

## 1. 표준 동작 및 책임 범위

1. lolcast 부모 페이지는 Firebase 로그인 상태, 닉네임, Firebase ID 토큰을 조회한다.
2. 등록된 iframe 게임은 `postMessage`로 로그인 정보를 요청한다.
3. 부모 페이지는 요청을 보낸 iframe의 오리진과 창을 모두 확인한 뒤, 해당 게임 오리진으로만 응답한다.
4. 로그인 상태라면 `nickname`과 `idToken`을 전달한다. 로그아웃 상태이거나 토큰을 가져오지 못했다면 두 값 모두 `null`로 전달한다.
5. 각 게임은 공통 응답 규격을 사용한다. 로그인 여부를 UI에 표시하는 것과 서버에서 계정을 안전하게 인증하는 것은 별개다.
6. 캐릭터, 기록, 재화, 랭킹 등 서버에 저장되는 사용자 데이터를 다루는 게임은 **게임 서버에서 ID 토큰을 검증**하고 검증된 토큰의 Firebase UID를 계정 식별자로 사용해야 한다. 닉네임만으로 계정을 식별하거나 권한을 부여하면 안 된다.

### lolcast 쪽과 게임 쪽의 작업 구분

- **lolcast 쪽**: 공통 인증 정보 조회, 공통 `postMessage` 브릿지, iframe 오리진·창 검증, 타일 팝아웃에도 동일 브릿지 적용.
- **각 게임 프런트엔드**: 공통 메시지를 요청하고 응답을 읽도록 수신 코드를 통일.
- **로그인 보호가 필요한 게임 서버**: Firebase ID 토큰 검증 및 검증된 UID 기준의 계정 연결 구현.
- 이 방식은 `chat-worker`의 CORS 변경을 전제로 하지 않는다. 다만 각 게임의 서버 인증 구현은 별도 작업이며, 부모 페이지에서 토큰을 전달하는 것만으로 서버 인증이 완성되는 것은 아니다.

## 2. 게임 목록 규칙

`public/js/tiles-screens.js`의 `GAMES` 목록은 공통 로그인 브릿지에 등록된 게임 목록이다. 기존의 게임별 `trusted: true/false` 토큰 전달 분기는 제거한다.

```js
export const GAMES = [
  {
    id: 'pong',
    title: '탁구',
    icon: '🏓',
    url: 'https://pingpong-1b7.pages.dev/',
  },
  // 예시의 탁구처럼 새 게임도 이 목록에 등록하면 동일한 로그인 브릿지 규격을 사용한다.
];
```

- `trusted` 속성으로 게임마다 토큰 전달 정책을 나누지 않는다.
- `url`의 origin은 부모가 응답할 때 사용하는 정확한 대상 origin이다. `'*'`를 사용하지 않는다.
- 새 게임은 토큰을 전달해도 되는 게임인지 검토한 뒤 등록한다.
- 한 게임의 URL을 외부 도메인으로 바꾸면 토큰 수신 대상도 바뀌므로 URL 변경을 보안 설정 변경으로 취급한다.

## 3. 공통 메시지 규격

### 새 표준 프로토콜

| 방향 | 메시지 | 필수 필드 |
|---|---|---|
| 게임 → 부모 | `lolcast:request-auth` | `type`, `protocolVersion: 1` |
| 부모 → 게임 | `lolcast:auth` | `type`, `protocolVersion: 1`, `loggedIn`, `nickname`, `idToken` |

로그인 상태 응답 예시:

```js
{
  type: 'lolcast:auth',
  protocolVersion: 1,
  loggedIn: true,
  nickname: '탁구닉네임',
  idToken: '<Firebase ID token>'
}
```

로그아웃 상태 또는 토큰 획득 실패 응답 예시:

```js
{
  type: 'lolcast:auth',
  protocolVersion: 1,
  loggedIn: false,
  nickname: null,
  idToken: null
}
```

- `loggedIn: true`는 부모가 유효한 ID 토큰을 가져와 전달했다는 뜻이다. 게임 서버가 해당 토큰을 검증하기 전까지 서버 인증이 완료된 것으로 간주하면 안 된다.
- `nickname`은 화면 표시용 프로필 정보이며 인증 수단이 아니다.
- `idToken`은 인증 증명이다. URL, 쿼리 문자열, 로그, 분석 이벤트 등에 넣지 않는다.
- `uid`는 별도 필드로 전달하지 않는다. 서버에서 토큰을 검증한 뒤 UID를 얻는다.

### 전환 기간의 기존 게임 호환

일부 기존 게임은 아래 구형 메시지명을 사용하고 있을 수 있다.

- 기존 요청: `lolcast:request-nickname`
- 기존 응답: `lolcast:nickname`

전환 중에는 부모 브릿지가 두 요청 형식을 모두 받을 수 있다.

- 새 요청 `lolcast:request-auth`에는 새 응답 `lolcast:auth`를 보낸다.
- 구형 요청 `lolcast:request-nickname`에는 호환 응답 `lolcast:nickname`을 보낸다. 이 응답에도 `loggedIn`, `nickname`, `idToken`, `protocolVersion`을 동일하게 포함한다.
- 모든 게임의 수신 코드를 새 규격으로 이전한 뒤 구형 별칭을 제거할 수 있다.

이 호환은 기존 프런트엔드의 메시지명을 단계적으로 바꾸기 위한 것이며, 닉네임만 확인하는 구형 게임 서버에 인증 보안을 자동으로 추가하지는 않는다.

## 4. lolcast 부모 페이지의 인증 정보 조회

기존 `getCurrentSiteNickname()`만 사용하던 코드를 공통 `getCurrentSiteAuth()`로 통합한다. 아래 예시는 Firebase **compat SDK** 기준이다.

```js
let firebaseAuthReadyPromise = null;

function waitForInitialFirebaseAuthState() {
  if (!firebaseAuthReadyPromise) {
    firebaseAuthReadyPromise = new Promise((resolve) => {
      const auth = firebase.auth();
      let unsubscribe = () => {};

      unsubscribe = auth.onAuthStateChanged(
        () => {
          unsubscribe();
          resolve();
        },
        () => {
          unsubscribe();
          resolve();
        }
      );
    });
  }

  return firebaseAuthReadyPromise;
}

async function getCurrentSiteAuth() {
  await waitForInitialFirebaseAuthState();

  const user = firebase.auth().currentUser;
  if (!user) {
    return { loggedIn: false, nickname: null, idToken: null };
  }

  // ID 토큰을 가져오지 못하면 인증된 응답으로 전달하지 않는다.
  let idToken;
  try {
    idToken = await user.getIdToken();
  } catch (error) {
    console.warn('[lolcast auth bridge] ID 토큰을 가져오지 못했습니다.', error);
    return { loggedIn: false, nickname: null, idToken: null };
  }

  // 닉네임 조회 실패가 토큰 자체의 인증 여부를 바꾸지는 않는다.
  let nickname = null;
  try {
    const doc = await firebase.firestore().collection('users').doc(user.uid).get();
    const value = doc.exists && doc.data() ? doc.data().nickname : null;
    nickname = typeof value === 'string' && value.trim() ? value.trim() : null;
  } catch (error) {
    console.warn('[lolcast auth bridge] 닉네임을 가져오지 못했습니다.', error);
  }

  return { loggedIn: true, nickname, idToken };
}

// 다른 코드가 닉네임만 필요로 한다면 기존 함수는 호환용으로 유지할 수 있다.
async function getCurrentSiteNickname() {
  return (await getCurrentSiteAuth()).nickname;
}
```

주의 사항:

- Firebase 최초 인증 상태가 정해지기 전에 `currentUser`를 읽으면, 이미 로그인한 사용자도 일시적으로 로그아웃 상태처럼 보일 수 있으므로 최초 상태 확인을 기다린다.
- Firestore 닉네임 조회에 실패해도 토큰을 정상적으로 얻었다면 `loggedIn: true`, `nickname: null`로 전달한다.
- ID 토큰을 가져오지 못했다면 닉네임만으로 로그인 성공처럼 처리하지 않는다.
- 토큰 값 자체를 콘솔에 출력하지 않는다.

## 5. 부모 페이지의 공통 iframe 브릿지

메시지 리스너는 iframe마다 중복 등록하지 않고, 페이지당 한 번만 등록한다. 각 iframe의 `contentWindow`와 등록된 게임 origin을 연결해 요청이 실제 등록된 iframe에서 왔는지 확인한다.

아래 코드는 공통 브릿지의 기준 예시다. 기존 게임 생성·닫기 로직에 맞춰 `attachIframeAuthBridge()`의 반환 함수가 iframe 제거 시 호출되도록 연결한다.

```js
const iframeAuthTargets = new Map();

/**
 * iframe을 공통 로그인 브릿지 대상에 등록한다.
 * iframe을 닫거나 제거할 때 반환된 detach 함수를 호출한다.
 */
function attachIframeAuthBridge(iframe, game) {
  const gameOrigin = new URL(game.url, window.location.href).origin;
  const targetWindow = iframe.contentWindow;
  const record = { iframe, gameOrigin, gameId: game.id };

  iframeAuthTargets.set(targetWindow, record);

  return function detachIframeAuthBridge() {
    if (iframeAuthTargets.get(targetWindow) === record) {
      iframeAuthTargets.delete(targetWindow);
    }
  };
}

// 페이지에서 한 번만 등록한다. attach 함수 안에 넣어 iframe마다 등록하지 않는다.
window.addEventListener('message', async (event) => {
  const record = iframeAuthTargets.get(event.source);
  if (!record) return;

  // 1) 등록된 iframe의 정확한 origin인지 확인한다.
  if (event.origin !== record.gameOrigin) return;

  const data = event.data;
  if (!data || typeof data !== 'object') return;

  const isAuthRequest =
    data.type === 'lolcast:request-auth' && data.protocolVersion === 1;
  const isLegacyRequest = data.type === 'lolcast:request-nickname';
  if (!isAuthRequest && !isLegacyRequest) return;

  const auth = await getCurrentSiteAuth();

  // 비동기 조회 중 iframe이 닫히거나 등록이 바뀌었으면 응답하지 않는다.
  if (iframeAuthTargets.get(event.source) !== record) return;

  const payload = isAuthRequest
    ? { type: 'lolcast:auth', protocolVersion: 1, ...auth }
    : { type: 'lolcast:nickname', protocolVersion: 1, ...auth };

  // 2) '*'가 아닌 해당 게임 origin으로만 전달한다.
  event.source.postMessage(payload, record.gameOrigin);
});
```

통합 시 확인할 점:

- 게임 iframe을 생성하는 지점에서 `attachIframeAuthBridge(iframe, game)`를 호출한다.
- iframe을 닫거나 재생성할 때 기존 `detachIframeAuthBridge()`를 호출한다.
- iframe을 다시 열면서 같은 iframe 요소를 재사용한다면 등록 상태가 최신 게임 설정을 가리키도록 갱신한다.
- `event.origin`만 확인하지 말고 `event.source`도 반드시 확인한다. 반대로 `event.source`만 확인하고 origin을 생략해서도 안 된다.
- 부모의 실제 사이트 origin과 게임 URL을 정확하게 사용하며, `postMessage(..., '*')`는 사용하지 않는다.
- `tiles-popout.html`도 게임 iframe을 생성한다면 같은 브릿지 코드를 사용한다. 가능하면 공통 JS 모듈로 분리해 두 페이지에서 재사용한다.

## 6. 각 게임 프런트엔드의 공통 수신 코드

모든 게임은 부모에게 같은 요청을 보내고 같은 응답 형식을 처리한다. 아래 예시에서 부모 origin은 실제 운영 주소인 `https://lolcast.kr`로 고정한다.

```js
const LOLCAST_ORIGIN = 'https://lolcast.kr';
let lolcastAuth = {
  loggedIn: false,
  nickname: null,
  idToken: null,
};

window.addEventListener('message', (event) => {
  if (event.origin !== LOLCAST_ORIGIN) return;
  if (event.source !== window.parent) return;

  const data = event.data;
  if (!data || typeof data !== 'object') return;

  const isNewResponse =
    data.type === 'lolcast:auth' && data.protocolVersion === 1;
  const isLegacyResponse = data.type === 'lolcast:nickname';
  if (!isNewResponse && !isLegacyResponse) return;

  lolcastAuth = {
    loggedIn: data.loggedIn === true && typeof data.idToken === 'string',
    nickname: typeof data.nickname === 'string' ? data.nickname : null,
    idToken: typeof data.idToken === 'string' ? data.idToken : null,
  };

  // 게임별 UI 갱신 함수에 공통 상태를 전달한다.
  onLolcastAuthChanged(lolcastAuth);
});

function requestLolcastAuth() {
  // 게임 주소를 직접 열었을 때는 부모 인증 브릿지가 없으므로 게스트로 처리한다.
  if (window.parent === window) {
    onLolcastAuthChanged(lolcastAuth);
    return;
  }

  window.parent.postMessage(
    { type: 'lolcast:request-auth', protocolVersion: 1 },
    LOLCAST_ORIGIN
  );
}

// 실제 게임에서 구현해야 하는 UI 갱신 함수 예시.
function onLolcastAuthChanged(auth) {
  if (auth.loggedIn) {
    // 닉네임은 표시용. 서버 계정 인증은 idToken을 서버에 보내 검증받아야 한다.
    console.log('lolcast 로그인 정보 수신');
  } else {
    // 게스트 화면 또는 lolcast 로그인 안내를 표시한다.
  }
}

requestLolcastAuth();
```

실제 적용 시 `onLolcastAuthChanged()`는 각 게임의 UI 구조에 맞춰 구현한다. 토큰을 확인하기 위해 `console.log(auth)`처럼 전체 객체를 출력해서는 안 된다.

- 직접 게임 URL을 열면 lolcast 부모가 없으므로 게스트 모드로 처리한다.
- 게임의 부모 origin이 운영 환경과 달라지는 테스트 환경은 별도 허용 origin을 명시적으로 설정한다. 무조건 `'*'`로 바꾸지 않는다.
- 로그인 상태가 바뀐 뒤 최신 상태가 필요하면 `requestLolcastAuth()`를 다시 호출하거나 별도의 인증 상태 갱신 메시지를 설계한다. 현재 기본 규격은 요청에 대한 응답 방식이며, 로그인 상태가 자동으로 실시간 동기화된다고 가정하지 않는다.

## 7. 게임 서버의 인증 규칙

ID 토큰을 받는 모든 게임이 동일하게 지켜야 할 규칙이다.

1. 서버는 클라이언트가 보낸 `idToken`을 신뢰하지 말고 공식 Firebase 토큰 검증 라이브러리 또는 올바르게 구현된 서명 검증으로 검증한다.
2. 서명뿐 아니라 만료 시간(`exp`), 발급 대상 프로젝트(`aud`), 발급자(`iss`), 사용자 식별자(`sub`) 등 필수 클레임을 검증한다.
3. 검증 후 얻은 Firebase UID를 계정의 기본 키로 사용한다. `nickname`, 클라이언트가 보낸 UID, 화면에 표시된 이름으로 계정을 연결하지 않는다.
4. 점수·전적·랭킹·보유 아이템·구매 기록 등 영속 데이터의 접근 권한은 검증된 UID에 연결한다.
5. 토큰 검증이 실패하거나 토큰이 없으면 인증이 필요한 기능을 거부하고 게스트로 처리한다.
6. 게임 서버가 자체 세션을 발급하는 경우 토큰 검증 후 자체 세션으로 교환할 수 있다. 자체 세션은 각 게임 서버의 만료·로그아웃 정책에 따른다.
7. ID 토큰은 보통 짧은 유효기간을 가지므로 장기 저장하거나 URL에 포함하지 않는다. 서버 로그에도 원문 토큰을 남기지 않는다.

**중요:** 기존 게임이 닉네임을 화면에 보여주기만 한다면 응답 필드를 읽는 수정으로 충분할 수 있다. 그러나 랭킹이나 저장 데이터를 해당 사용자 계정에 안전하게 연결하려면 그 게임 서버에도 토큰 검증 및 UID 기반 계정 처리가 필요하다. 부모 쪽 브릿지만 공통화했다고 모든 게임의 기존 데이터가 자동으로 계정 인증되는 것은 아니다.

## 8. 기존 게임 전환 계획

1. lolcast 부모 브릿지를 공통 규격으로 바꾸고, `GAMES`에 등록된 모든 iframe을 대상으로 인증 정보를 응답하게 한다.
2. `tiles-popout.html`도 같은 브릿지를 사용하는지 확인한다.
3. 각 게임 프런트엔드를 `lolcast:request-auth` / `lolcast:auth` 규격으로 이전한다. 전환 중에는 구형 메시지 별칭을 허용한다.
4. 로그인에 따른 점수·전적·랭킹 등 사용자 데이터 보존이 필요한 게임은 서버 검증과 Firebase UID 기반 계정 연결을 적용한다.
5. 모든 게임이 이전된 뒤 구형 메시지 `lolcast:request-nickname` / `lolcast:nickname` 지원을 제거할지 결정한다.
6. `trusted` 플래그를 참조하는 옛 분기가 남지 않았는지 검색해 제거한다.

## 9. 테스트 체크리스트

### 공통 브릿지

1. 로그인 상태에서 타일의 각 게임을 열면 모든 게임이 `loggedIn: true`, 닉네임, ID 토큰을 받는다.
2. 로그아웃 상태에서 각 게임을 열면 `loggedIn: false`, `nickname: null`, `idToken: null`을 받는다.
3. Firebase 초기화가 끝나기 전에 요청해도 이미 로그인한 사용자가 잘못 게스트 처리되지 않는지 확인한다.
4. 닉네임 문서 조회가 실패해도 토큰 조회가 성공하면 로그인 응답이 유지되고 닉네임만 `null`이 되는지 확인한다.
5. 등록되지 않은 창, 다른 origin, 다른 iframe에서 보낸 요청에 응답하지 않는지 확인한다.
6. iframe을 닫은 뒤 이전 iframe의 요청에 더 이상 응답하지 않는지 확인한다.
7. `postMessage` 전송에 `'*'`가 사용되지 않는지 확인한다.
8. `tiles.html`과 `tiles-popout.html` 양쪽에서 동일하게 동작하는지 확인한다.

### 게임 서버 인증

9. 정상 ID 토큰은 검증되고, 만료·위조·다른 Firebase 프로젝트의 토큰은 거부되는지 확인한다.
10. 닉네임만 위조해서 보내거나 `idToken`을 빼고 요청하면 다른 사용자 데이터에 접근할 수 없는지 확인한다.
11. 같은 lolcast 계정으로 다시 접속해도 새 캐릭터가 중복 생성되지 않고 기존 Firebase UID에 연결되는지 확인한다.
12. 직접 게임 URL을 열었을 때는 게스트 모드가 유지되는지 확인한다.
13. 토큰 원문이 브라우저 콘솔, 서버 로그, URL 또는 분석 로그에 남지 않는지 확인한다.

## 10. 공통 표준 적용 원칙

- 탁구를 포함해 `GAMES`에 등록된 모든 iframe 게임은 같은 인증 요청·응답 규격을 사용한다.
- 게임별로 토큰 전달 여부를 나누는 분기를 두지 않고, 등록된 게임에 공통 인증 응답을 제공한다.
- 기존 게임에서 사용하던 `lolcast:request-nickname` 수신은 전환 기간 동안 호환할 수 있다.
- 공통 프로토콜은 `lolcast:request-auth` / `lolcast:auth`로 정의한다.
- 각 게임의 로그인 UI와 서버 인증은 게임별 구현이 필요하지만, 부모와 게임 간 메시지 규격 및 기본 보안 규칙은 공통으로 고정한다.
- Firebase 프로젝트 ID, 게임 URL, 서버 검증 방식 등 배포 환경별 값은 실제 운영 설정을 기준으로 채운다. 이 문서만으로 미정 값이나 현재 각 게임의 서버 구현 상태를 확정하지 않는다.
